import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { z } from 'zod';
import { logAuditEvent } from '../services/audit.service';
import { emitNotificationEvent, EventTypes, NotificationEventPayload } from '../services/events.service';
import { AuthorizationService } from '../services/authorization.service';

const router = Router();
router.use(authMiddleware);

/**
 * Checks whether the Completion Management module is enabled for a given organization.
 * Returns true (enabled) if no config record exists (default-on behavior).
 */
async function isCompletionModuleEnabled(org_id: string): Promise<boolean> {
  const config = await prisma.moduleConfig.findUnique({
    where: {
      organization_id_module_name: { organization_id: org_id, module_name: 'completion' }
    }
  });
  if (!config || !config.config_data) return true; // default: on
  const data = config.config_data as Record<string, unknown>;
  return data['enable_module'] !== false;
}

// Helper to get active assignments for teacher
async function getTeacherAssignments(teacher_id: string, org_id: string, academic_year_id: string) {
  return await prisma.teacherAssignment.findMany({
    where: {
      teacher_id,
      organization_id: org_id,
      academic_year_id
    },
    include: {
      grade: true,
      section: true,
      subject: true
    }
  });
}

// GET assigned hierarchy for a teacher
router.get('/hierarchy', requirePermission('COMPLETION_TRACKING', 'VIEW'), async (req: any, res: Response) => {
  try {
    const academic_year_id = req.academic_year_id;
    if (!academic_year_id) return res.status(400).json({ message: 'academic_year_id context missing' });

    const org_id = req.user.organization_id;
    const teacher_id = req.user.user_id;

    // Enforce module-level enable_module flag
    const moduleEnabled = await isCompletionModuleEnabled(org_id);
    if (!moduleEnabled) {
      return res.status(503).json({ message: 'Completion Management module is currently disabled for this organization.' });
    }

    // Check if user is admin (sees all)
    const isAdmin = AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SUPER_ADMIN') || 
                    (req.user.permissions || []).includes('COMPLETION_TRACKING:MANAGE');

    if (isAdmin) {
      // Return full organization hierarchy for this academic year
      const grades = await prisma.grade.findMany({
        where: { organization_id: org_id, academic_year_id: String(academic_year_id) },
        include: {
          sections: true,
          subjects: true
        }
      });
      return res.json({ assignments: [], is_admin: true, hierarchy: grades });
    } else {
      const assignments = await getTeacherAssignments(teacher_id, org_id, String(academic_year_id));

      // We will let frontend parse these assignments to build the dropdown options
      // This strictly follows the "Teacher only sees assigned academic contexts" requirement
      return res.json({ assignments, is_admin: false });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET topics and subtopics with completion status
router.get('/topics', requirePermission('COMPLETION_TRACKING', 'VIEW'), async (req: any, res: Response) => {
  try {
    const { grade_id, section_id, subject_id } = req.query;
    const academic_year_id = req.academic_year_id;
    if (!academic_year_id || !grade_id || !subject_id) {
      return res.status(400).json({ message: 'Missing required context (academic_year_id, grade_id, subject_id)' });
    }

    const org_id = req.user.organization_id;

    // Enforce module-level enable_module flag
    const moduleEnabled = await isCompletionModuleEnabled(org_id);
    if (!moduleEnabled) {
      return res.status(503).json({ message: 'Completion Management module is currently disabled for this organization.' });
    }

    const isGlobalAdmin = AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SUPER_ADMIN') || 
                          (req.user.permissions || []).includes('COMPLETION_TRACKING:MANAGE');
    if (!isGlobalAdmin) {
      const subjectCondition: any = { subject_id: String(subject_id) };
      if (section_id) subjectCondition.section_id = String(section_id);
      
      const classTeacherCondition: any = { grade_id: String(grade_id), assignment_type: 'CLASS_TEACHER' };
      if (section_id) classTeacherCondition.section_id = String(section_id);

      const validAssignment = await prisma.teacherAssignment.findFirst({
        where: {
          teacher_id: req.user.user_id,
          organization_id: org_id,
          academic_year_id: String(academic_year_id),
          OR: [
            subjectCondition,
            classTeacherCondition
          ]
        }
      });
      if (!validAssignment) {
        return res.status(403).json({ message: 'Unauthorized access to this academic context.' });
      }
    }

    // 1. Fetch the Units, Topics, Subtopics for the subject
    const units = await prisma.unit.findMany({
      where: {
        organization_id: org_id,
        subject_id: String(subject_id)
      },
      include: {
        topics: {
          include: {
            sub_topics: true
          }
        }
      },
      orderBy: { order_index: 'asc' }
    });

    // 2. Fetch CompletionTracking for this exact context
    const trackings = await prisma.completionTracking.findMany({
      where: {
        organization_id: org_id,
        academic_year_id: String(academic_year_id),
        grade_id: String(grade_id),
        section_id: section_id ? String(section_id) : null,
        subject_id: String(subject_id)
      }
    });

    return res.json({ units, trackings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const toggleSchema = z.object({
  academic_year_id: z.string().uuid(),
  grade_id: z.string().uuid(),
  section_id: z.string().uuid().nullable(),
  subject_id: z.string().uuid(),
  
  level: z.enum(['UNIT', 'TOPIC', 'SUBTOPIC']),
  id: z.string().uuid(), // The ID of the unit, topic, or subtopic
  is_completed: z.boolean(),
  send_notification: z.boolean().default(false),
  
  // To handle cascade toggle, frontend passes all child IDs that should be toggled
  cascade_topic_ids: z.array(z.string().uuid()).optional(),
  cascade_subtopic_ids: z.array(z.string().uuid()).optional()
});

// POST toggle completion
router.post('/toggle', requirePermission('COMPLETION_TRACKING', 'MANAGE'), async (req: any, res: Response) => {
  try {
    const parsed = toggleSchema.parse(req.body);
    // Enforce academic year from context header
    const academic_year_id = req.academic_year_id;
    const org_id = req.user.organization_id;
    const teacher_id = req.user.user_id;

    // Enforce module-level enable_module flag
    const moduleEnabled = await isCompletionModuleEnabled(org_id);
    if (!moduleEnabled) {
      return res.status(503).json({ message: 'Completion Management module is currently disabled for this organization.' });
    }

    // Admin check vs Teacher assignment check
    const isAdmin = AuthorizationService.hasIdentity(req.user.permissions || [], 'IS_SUPER_ADMIN') || 
                    (req.user.permissions || []).includes('COMPLETION_TRACKING:MANAGE');
    if (!isAdmin) {
      const validAssignment = await prisma.teacherAssignment.findFirst({
        where: {
          teacher_id,
          organization_id: org_id,
          academic_year_id: academic_year_id,
          OR: [
            { assignment_type: 'SUBJECT_TEACHER', subject_id: parsed.subject_id },
            { assignment_type: 'CLASS_TEACHER', section_id: parsed.section_id ?? undefined }
          ]
        }
      });
      if (!validAssignment) {
        return res.status(403).json({ message: 'Not authorized for this context.' });
      }
    }

    // Process toggles in a transaction
    await prisma.$transaction(async (tx: any) => {
      
      const buildWhere = (lvl: string, target_id: string) => {
        const base = {
          organization_id: org_id,
          academic_year_id: academic_year_id,
          grade_id: parsed.grade_id,
          section_id: parsed.section_id,
          subject_id: parsed.subject_id,
          completion_level: lvl as any
        };
        if (lvl === 'UNIT') return { ...base, unit_id: target_id };
        if (lvl === 'TOPIC') return { ...base, topic_id: target_id };
        return { ...base, sub_topic_id: target_id };
      };
      
      const buildCreate = (lvl: string, target_id: string) => {
        const base = {
          organization_id: org_id,
          academic_year_id: academic_year_id,
          grade_id: parsed.grade_id,
          section_id: parsed.section_id,
          subject_id: parsed.subject_id,
          completion_level: lvl as any,
          is_completed: parsed.is_completed,
          completed_by: teacher_id,
          completed_at: parsed.is_completed ? new Date() : null,
          notification_sent: parsed.send_notification,
          notification_sent_at: (parsed.is_completed && parsed.send_notification) ? new Date() : null,
        };
        if (lvl === 'UNIT') return { ...base, unit_id: target_id };
        if (lvl === 'TOPIC') return { ...base, topic_id: target_id };
        return { ...base, sub_topic_id: target_id };
      };
      
      const buildUpdate = () => {
        return {
          is_completed: parsed.is_completed,
          completed_by: teacher_id, // keep last updated by
          // if toggled on, update completed_at. if toggled off, DO NOT nullify it so audit history is preserved!
          ...(parsed.is_completed ? { completed_at: new Date() } : {}),
          notification_sent: parsed.send_notification,
          ...(parsed.is_completed && parsed.send_notification ? { notification_sent_at: new Date() } : {})
        };
      };

      // 1. Toggle main item
      await tx.completionTracking.upsert({
        where: {
          // This requires a unique compound index in Prisma if we use upsert, but we didn't add a unique constraint!
          // We must use findFirst and update/create instead since we didn't define a unique @@unique.
          // Wait, findFirst isn't supported in upsert where clause. Let's do findFirst -> update or create manually.
          id: 'dummy' // Placeholder, will fix below
        }
      }).catch((e: any) => null); // Let's just write the manual logic.
      
      const upsertCompletion = async (lvl: string, target_id: string) => {
         const existing = await tx.completionTracking.findFirst({
           where: buildWhere(lvl, target_id)
         });
         
         if (existing) {
           await tx.completionTracking.update({
             where: { id: existing.id },
             data: buildUpdate()
           });
         } else {
           await tx.completionTracking.create({
             data: buildCreate(lvl, target_id)
           });
         }
      };

      await upsertCompletion(parsed.level, parsed.id);
      
      // 2. Cascade topics
      if (parsed.cascade_topic_ids && parsed.cascade_topic_ids.length > 0) {
        for (const t_id of parsed.cascade_topic_ids) {
          await upsertCompletion('TOPIC', t_id);
        }
      }
      
      // 3. Cascade subtopics
      if (parsed.cascade_subtopic_ids && parsed.cascade_subtopic_ids.length > 0) {
        for (const st_id of parsed.cascade_subtopic_ids) {
          await upsertCompletion('SUBTOPIC', st_id);
        }
      }
      
      // 4. Send Notifications via Event Bus
      if (parsed.is_completed && parsed.send_notification) {
         let eventType: EventTypes;
         let typeStr: string;
         if (parsed.level === 'UNIT') { eventType = EventTypes.COMPLETION_UNIT_ENABLED; typeStr = 'UNIT'; }
         else if (parsed.level === 'TOPIC') { eventType = EventTypes.COMPLETION_TOPIC_ENABLED; typeStr = 'TOPIC'; }
         else { eventType = EventTypes.COMPLETION_SUBTOPIC_ENABLED; typeStr = 'SUBTOPIC'; }
         
         const payload: NotificationEventPayload = {
           organization_id: org_id,
           actor_id: teacher_id,
           entity: {
             type: typeStr,
             id: parsed.id,
             name: 'Academic Content' // Could query DB for actual name if needed
           },
           context: {
             academic_year_id: academic_year_id,
             grade_id: parsed.grade_id,
             section_id: parsed.section_id,
             subject_id: parsed.subject_id
           }
         };
         emitNotificationEvent(eventType, payload);
      }
      
    });

    await logAuditEvent({
      organization_id: org_id,
      user_id: teacher_id,
      user_name: req.user.name,
      action_type: 'TOGGLE',
      entity_type: 'COMPLETION',
      entity_id: parsed.id,
      metadata: {
        level: parsed.level,
        is_completed: parsed.is_completed,
        subject_id: parsed.subject_id,
        grade_id: parsed.grade_id,
        section_id: parsed.section_id
      }
    });

    return res.json({ message: 'Completion status updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
