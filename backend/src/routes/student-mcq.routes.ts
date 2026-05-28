import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { getActiveAcademicYearId } from '../utils/academic-helper';

const router = Router();
router.use(authMiddleware);

async function isMcqModuleEnabled(org_id: string): Promise<boolean> {
  const config = await prisma.moduleConfig.findUnique({
    where: {
      organization_id_module_name: { organization_id: org_id, module_name: 'mcq' }
    }
  });
  if (!config || !config.config_data) return true; // default: on
  const data = config.config_data as Record<string, unknown>;
  return data['enable_module'] !== false;
}

const checkMcqEnabled = async (req: any, res: Response, next: any) => {
  const enabled = await isMcqModuleEnabled(req.user.organization_id);
  if (!enabled) {
    return res.status(503).json({ message: 'MCQ module is currently disabled for this organization.' });
  }
  next();
};

// GET /student-mcq/curriculum
router.get('/curriculum', requirePermission('MCQ', 'VIEW'), checkMcqEnabled, async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const student_id = req.user.user_id;

    const academic_year_id = await getActiveAcademicYearId(org_id);
    if (!academic_year_id) {
      return res.status(400).json({ message: 'No active academic year found' });
    }

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        student_id,
        academic_year_id,
        organization_id: org_id,
        status: 'ACTIVE'
      },
      include: {
        grade: true,
        section: true
      }
    });

    if (!enrollment || !enrollment.grade_id) {
      return res.status(404).json({ message: 'Student enrollment not found for the current academic year' });
    }

    // Fetch subjects for this grade
    const subjects = await prisma.subject.findMany({
      where: {
        grade_id: enrollment.grade_id,
        organization_id: org_id
      },
      select: {
        id: true,
        name: true
      }
    });

    const subjectIds = subjects.map((s: any) => s.id);

    // Fetch units for these subjects
    const units = await prisma.unit.findMany({
      where: {
        subject_id: { in: subjectIds },
        organization_id: org_id
      },
      select: {
        id: true,
        name: true,
        subject_id: true
      }
    });
    const unitIds = units.map((u: any) => u.id);

    // Fetch topics for these units
    const topics = await prisma.topic.findMany({
      where: {
        unit_id: { in: unitIds },
        organization_id: org_id
      },
      select: {
        id: true,
        name: true,
        unit_id: true
      }
    });
    const topicIds = topics.map((t: any) => t.id);

    // Fetch subtopics for these topics
    const subTopics = await prisma.subTopic.findMany({
      where: {
        topic_id: { in: topicIds },
        organization_id: org_id
      },
      select: {
        id: true,
        name: true,
        topic_id: true
      }
    });

    res.json({
      grade: enrollment.grade,
      section: enrollment.section,
      subjects,
      units,
      topics,
      subTopics
    });

  } catch (error: any) {
    console.error('Error fetching student curriculum:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /student-mcq/questions
router.get('/questions', requirePermission('MCQ', 'VIEW'), checkMcqEnabled, async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const { sub_topic_id, topic_id, unit_id, subject_id } = req.query;

    const filter: any = { organization_id: org_id };
    
    if (sub_topic_id) filter.sub_topic_id = String(sub_topic_id);
    else if (topic_id) filter.topic_id = String(topic_id);
    else if (unit_id) filter.unit_id = String(unit_id);
    else if (subject_id) filter.subject_id = String(subject_id);
    else {
      return res.status(400).json({ message: 'Please provide at least a subject_id' });
    }

    // Only fetch MCQ types
    filter.type = { in: ['MCQ_SINGLE', 'MCQ_MULTI'] };

    const questions = await prisma.question.findMany({
      where: filter,
      select: {
        id: true,
        question_text: true,
        type: true,
        marks: true,
        difficulty: true,
        answer_config: true,
        // we intentionally omit 'answer' so students don't cheat by checking network responses
        // unless they are meant to self-check. We will send the answer if this is for practice.
        // For practice mode, let's include it.
        answer: true 
      }
    });

    res.json(questions);
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /student-mcq/attempts
router.post('/attempts', requirePermission('MCQ', 'ATTEMPT'), checkMcqEnabled, async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const student_id = req.user.user_id;

    const {
      subject_id,
      unit_id,
      topic_id,
      sub_topic_id,
      attempt_count,
      start_time,
      end_time,
      total_questions,
      correct_answers
    } = req.body;

    if (!subject_id || !start_time || !end_time || total_questions === undefined || correct_answers === undefined) {
      return res.status(400).json({ message: 'Missing required fields for attempt' });
    }

    const newAttempt = await (prisma as any).studentAssessmentAttempt.create({
      data: {
        organization_id: org_id,
        student_id: student_id,
        subject_id: subject_id,
        unit_id: unit_id || null,
        topic_id: topic_id || null,
        sub_topic_id: sub_topic_id || null,
        attempt_count: attempt_count || 1,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        total_questions: total_questions,
        correct_answers: correct_answers
      }
    });

    res.status(201).json({ message: 'Attempt saved successfully', attempt: newAttempt });
  } catch (error: any) {
    console.error('Error saving student attempt:', error);
    res.status(500).json({ message: 'Server error while saving attempt' });
  }
});

export default router;
