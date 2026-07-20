import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { getActiveAcademicYearId } from '../utils/academic-helper';
import { checkTeacherSubjectAccess } from '../services/academic-compatibility.service';
import { logAuditEvent } from '../services/audit.service';
import { NotificationService } from '../services/notification.service';

const router = Router();
router.use(authMiddleware);

const upload = multer({ storage: multer.memoryStorage() });

const questionTypeEnum = z.enum([
  'MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO',
  'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING',
  'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK',
  'STRUCTURED_5MARK', 'LONG_ANSWER'
]);

const questionSchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  topic_id: z.string().uuid().nullable().optional(),
  sub_topic_id: z.string().uuid().nullable().optional(),
  grade_id: z.string().uuid().nullable().optional(),
  section_id: z.string().uuid().nullable().optional(),
  question_text: z.string().min(1),
  type: questionTypeEnum.default('MCQ_SINGLE'),
  answer: z.string().optional(),
  answer_config: z.any(), // Will be validated based on type
  marks: z.number().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  is_important: z.boolean().default(false),
  is_repeated: z.boolean().default(false)
});

// Type-specific validators
const validateConfig = (type: string, config: any) => {
  switch (type) {
    case 'MCQ_SINGLE':
      return z.object({ options: z.array(z.string()).min(2), correct_answer: z.number() }).parse(config);
    case 'MCQ_MULTI':
      return z.object({ options: z.array(z.string()).min(2), correct_answers: z.array(z.number()).min(1) }).parse(config);
    case 'TRUE_FALSE':
      return z.object({ correct_answer: z.boolean() }).parse(config);
    case 'YES_NO':
      return z.object({ correct_answer: z.enum(['yes', 'no']) }).parse(config);
    case 'FILL_BLANK':
      return z.object({ sentence: z.string().min(1), blanks: z.array(z.string()).min(1) }).parse(config);
    // ... we can add more as needed, but for now we trust the generic structure for the rest
    default:
      return config;
  }
};

// Helper: Ensure teacher is assigned
const hasSubjectAccess = async (teacher_id: string, subject_id: string, org_id: string) => {
  return await checkTeacherSubjectAccess(teacher_id, subject_id, org_id);
};

// Helper: Validate Hierarchy
const validateHierarchy = async (subject_id: string | null | undefined, unit_id: string | null | undefined, topic_id: string | null | undefined, sub_topic_id: string | null | undefined, org_id: string) => {
  if (unit_id) {
    if (!subject_id) return false;
    const unit = await prisma.unit.findFirst({
      where: { id: unit_id, organization_id: org_id, OR: [{ subject_id }, { syllabus: { subject_id } }] }
    });
    if (!unit) return false;
  }

  if (topic_id) {
    if (!unit_id) return false;
    const topic = await prisma.topic.findFirst({
      where: { id: topic_id, unit_id, organization_id: org_id }
    });
    if (!topic) return false;
  }

  if (sub_topic_id) {
    if (!topic_id) return false;
    const subTopic = await prisma.subTopic.findFirst({
      where: { id: sub_topic_id, topic_id, organization_id: org_id }
    });
    return !!subTopic;
  }
  return true;
};

// CREATE SINGLE QUESTION
router.post('/', requirePermission('QUESTION_BANK', 'CREATE'), async (req: any, res: Response) => {
  try {
    const parsed = questionSchema.parse(req.body);
    const org_id = req.user.organization_id;
    const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');

    if (!isGlobalAdmin) {
      if (parsed.subject_id) {
        const canAccess = await hasSubjectAccess(req.user.user_id, parsed.subject_id, org_id);
        if (!canAccess) return res.status(403).json({ message: 'Unauthorized access to this subject' });
      }
    }

    const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, parsed.sub_topic_id, org_id);
    if (!isValidHierarchy) return res.status(400).json({ message: 'Invalid hierarchy: subject -> unit -> topic -> sub_topic mismatch' });

    if (parsed.subject_id) {
      const subject = await prisma.subject.findFirst({ where: { id: parsed.subject_id, organization_id: org_id } });
      if (subject) {
        if (parsed.grade_id && parsed.grade_id !== subject.grade_id) {
          return res.status(400).json({ message: 'Provided grade_id does not match the subject\'s grade_id' });
        }
        parsed.grade_id = subject.grade_id;
      }
    }

    // Validate type-specific config
    try {
      validateConfig(parsed.type, parsed.answer_config);
    } catch (err: any) {
      return res.status(400).json({ message: 'Invalid answer configuration', errors: err.errors });
    }

    const question = await prisma.question.create({
      data: {
        ...parsed,
        organization_id: org_id,
        created_by: req.user.user_id,
        answer_config: parsed.answer_config as any
      },
      include: {
        creator: { select: { id: true, name: true } }
      }
    });

    await logAuditEvent({
      organization_id: org_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'CREATE',
      entity_type: 'QUESTION',
      entity_id: question.id,
      metadata: { subject_id: question.subject_id, grade_id: question.grade_id }
    });

    await NotificationService.sendNotification({
      organization_id: org_id,
      event_type: 'QUESTION_BANK',
      entity_type: 'QUESTION',
      entity_id: question.id,
      title: 'Question Added',
      message: `A new question has been successfully added to the bank.`,
      context_data: { icon: 'add_circle_outline', color: 'notification-green' },
      recipient_ids: [req.user.user_id]
    });

    res.status(201).json({ message: 'Question created', question });
  } catch (error: any) {
    if (error?.errors) return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    console.error('[Question Create Error]', error);
    res.status(500).json({ message: 'Server Error', detail: error?.message });
  }
});

// READ QUESTIONS
router.get('/', requirePermission('QUESTION_BANK', 'READ'), async (req: any, res: Response) => {
  try {
    const { grade_id, subject_id, difficulty, section_id, unit_id, topic_id, sub_topic_id } = req.query;
    const filter: any = { organization_id: req.user.organization_id };
    if (subject_id) filter.subject_id = String(subject_id);
    if (difficulty) filter.difficulty = String(difficulty);
    if (section_id) filter.section_id = String(section_id);
    if (unit_id) filter.unit_id = String(unit_id);
    if (topic_id) filter.topic_id = String(topic_id);
    if (sub_topic_id) filter.sub_topic_id = String(sub_topic_id);
    if (grade_id) {
      filter.OR = [
        { grade_id: String(grade_id) },
        { subject: { grade_id: String(grade_id) } }
      ];
    }

    const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
    if (!isGlobalAdmin) {
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacher_id: req.user.user_id, organization_id: req.user.organization_id }
      });

      const inchargeGradeIds = assignments
        .filter((a: any) => a.assignment_type === 'CLASS_INCHARGE')
        .map((a: any) => a.grade_id);

      const specificSubjectIds = assignments
        .filter((a: any) => a.subject_id)
        .map((a: any) => a.subject_id);

      const allowedSubjects = await prisma.subject.findMany({
        where: {
          organization_id: req.user.organization_id,
          OR: [
            { grade_id: { in: inchargeGradeIds } },
            { id: { in: specificSubjectIds } }
          ]
        },
        select: { id: true }
      });
      const allowedSubjectIds = allowedSubjects.map((s: any) => s.id);

      if (filter.subject_id) {
        if (!allowedSubjectIds.includes(filter.subject_id)) {
          return res.status(403).json({ message: 'Unauthorized access to this subject' });
        }
      } else {
        const authFilter = {
          OR: [
            { subject_id: { in: allowedSubjectIds } },
            { subject_id: null, grade_id: { in: inchargeGradeIds } }
          ]
        };

        if (filter.OR) {
          filter.AND = [
            { OR: filter.OR },
            authFilter
          ];
          delete filter.OR;
        } else {
          filter.OR = authFilter.OR;
        }
      }
    }

    const questions = await prisma.question.findMany({
      where: filter,
      include: {
        subject: { select: { id: true, name: true, grade_id: true } },
        unit: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
        sub_topic: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// EDIT QUESTION
router.put('/:id', requirePermission('QUESTION_BANK', 'EDIT'), async (req: any, res: Response) => {
  try {
    const org_id = req.user.organization_id;
    const existing = await prisma.question.findFirst({ where: { id: req.params.id, organization_id: org_id } });
    if (!existing) return res.status(404).json({ message: 'Question not found' });

    const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
    if (!isGlobalAdmin && existing.created_by !== req.user.user_id) {
      return res.status(403).json({ message: 'Only creator or admins can edit' });
    }

    const parsed = questionSchema.parse(req.body);
    if (!isGlobalAdmin && parsed.subject_id) {
      const canAccess = await hasSubjectAccess(req.user.user_id, parsed.subject_id, org_id);
      if (!canAccess) {
        return res.status(403).json({ message: 'Teacher is not assigned to this subject or grade' });
      }
    }

    const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, parsed.sub_topic_id, org_id);
    if (!isValidHierarchy) return res.status(400).json({ message: 'Invalid hierarchy' });

    if (parsed.subject_id) {
      const subject = await prisma.subject.findFirst({ where: { id: parsed.subject_id, organization_id: org_id } });
      if (subject) {
        if (parsed.grade_id && parsed.grade_id !== subject.grade_id) {
          return res.status(400).json({ message: 'Provided grade_id does not match the subject\'s grade_id' });
        }
        parsed.grade_id = subject.grade_id;
      }
    }

    const updated = await prisma.question.update({
      where: { id: existing.id },
      data: parsed
    });

    await logAuditEvent({
      organization_id: org_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'UPDATE',
      entity_type: 'QUESTION',
      entity_id: updated.id,
      metadata: { subject_id: updated.subject_id, grade_id: updated.grade_id }
    });

    await NotificationService.sendNotification({
      organization_id: org_id,
      event_type: 'QUESTION_BANK',
      entity_type: 'QUESTION',
      entity_id: updated.id,
      title: 'Question Updated',
      message: `Question details have been successfully updated.`,
      context_data: { icon: 'edit', color: 'notification-blue' },
      recipient_ids: [req.user.user_id]
    });

    res.json({ message: 'Question updated', question: updated });
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating question' });
  }
});

// DELETE QUESTION
router.delete('/:id', requirePermission('QUESTION_BANK', 'DELETE'), async (req: any, res: Response) => {
  try {
    const existing = await prisma.question.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
    if (!existing) return res.status(404).json({ message: 'Question not found' });

    const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
    if (!isGlobalAdmin && existing.created_by !== req.user.user_id) {
      return res.status(403).json({ message: 'Only creator or admins can delete' });
    }

    await prisma.question.delete({ where: { id: existing.id } });

    await logAuditEvent({
      organization_id: req.user.organization_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'DELETE',
      entity_type: 'QUESTION',
      entity_id: existing.id,
      metadata: { subject_id: existing.subject_id, grade_id: existing.grade_id }
    });

    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question' });
  }
});

// CSV TEMPLATE DOWNLOAD
router.get('/bulk/template', requirePermission('QUESTION_BANK', 'IMPORT'), (req: any, res: Response) => {
  const header = [
    'board',
    'medium',
    'grade',
    'subject',
    'unit_lesson',
    'topic',
    'question_type',
    'question',
    'option1',
    'option2',
    'option3',
    'option4',
    'answer',
    'marks',
    'difficulty_level',
    'important_question',
    'repeated_question',
    'prepared_by'
  ].join(',');

  const example = [
    'State',
    'English',
    '6',
    'Math',
    'Algebra',
    'Linear Eq',
    'mcq',
    '2x+4=10 x=?',
    '2',
    '3',
    '4',
    '5',
    '3',
    '1',
    'easy',
    'TRUE',
    'FALSE',
    'Admin'
  ].join(',');

  const csv = `${header}\n${example}`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="question_bank_template.csv"');
  res.send(csv);
});

// ── Smart name normalizers ────────────────────────────────────────────────────
/**
 * Extracts the numeric/ordinal identifier from a grade name so that all of:
 * "Grade 1", "1st", "Std 1", "Standard 1", "Class 1", "1st Grade", "1"
 * resolve to the same string ("1") for comparison.
 */
const normalizeGradeName = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/\b(grade|standard|std|class|form|level)\b/g, '') // strip label words
    .replace(/\b(st|nd|rd|th)\b/g, '')                          // strip ordinal suffixes
    .replace(/[^0-9a-z]/g, '')                                   // keep alphanumeric only
    .trim();

/**
 * General name normalizer for subjects, units, and topics.
 * Lowercases, collapses whitespace/hyphens/underscores into a single space.
 */
const normalizeName = (raw: string): string =>
  raw.toLowerCase().replace(/[\s\-_]+/g, ' ').trim();

/**
 * Fuzzy match: checks exact normalized equality first, then falls back to
 * "one name contains the other" to handle prefix/suffix differences
 * e.g. "Unit 1 - Numbers" in DB matching "Numbers" in CSV, or vice-versa.
 */
const fuzzyMatch = (dbName: string, csvName: string): boolean => {
  const a = normalizeName(dbName);
  const b = normalizeName(csvName);
  return a === b || a.includes(b) || b.includes(a);
};

// Helper: build answer_config from CSV row based on question type
const buildAnswerConfig = (type: string, row: any): any => {
  switch (type) {
    case 'MCQ_SINGLE':
    case 'MCQ': {
      const opts = ['option1', 'option2', 'option3', 'option4']
        .map(k => row[k])
        .filter(Boolean);
      // Let's assume correct answer might be index or value
      const ans = String(row.answer || '').trim();
      let idx = parseInt(ans, 10);
      if (isNaN(idx) || idx < 1 || idx > 4) {
        idx = opts.indexOf(ans) + 1; // Try matching text
      }
      return { options: opts, correct_answer: (idx > 0) ? (idx - 1) : 0 };
    }
    case 'MCQ_MULTI': {
      const opts = ['option_a', 'option_b', 'option_c', 'option_d']
        .map(k => row[k])
        .filter(Boolean);
      const letters = String(row.correct_options || '').split(',').map((l: string) => l.trim().toUpperCase());
      const idxs = letters.map((l: string) => ['A', 'B', 'C', 'D'].indexOf(l)).filter((i: number) => i >= 0);
      return { options: opts, correct_answers: idxs };
    }
    case 'TRUE_FALSE': {
      const val = String(row.true_false_answer || '').trim().toLowerCase();
      return { correct_answer: val === 'true' };
    }
    case 'YES_NO': {
      const val = String(row.yes_no_answer || '').trim().toLowerCase();
      return { correct_answer: val === 'yes' ? 'yes' : 'no' };
    }
    case 'FILL_BLANK': {
      const sentence = String(row.fill_blank_sentence || '').trim();
      const blanks = String(row.fill_blank_answers || '').split('|').map((b: string) => b.trim()).filter(Boolean);
      return { sentence, blanks };
    }
    default:
      return {};
  }
};

import { randomUUID } from 'crypto';

// BULK PREVIEW — simplified validation without hierarchy matching
router.post('/bulk/preview', requirePermission('QUESTION_BANK', 'IMPORT'), upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    if (!records || records.length === 0) return res.status(400).json({ message: 'Empty or invalid CSV spreadsheet' });

    const org_id = req.user.organization_id;
    const session_id = randomUUID();

    const existingQuestions = await prisma.question.findMany({
      where: { organization_id: org_id },
      select: {
        question_text: true,
        grade: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        unit: { select: { name: true } },
        topic: { select: { name: true } },
        sub_topic: { select: { name: true } },
        answer: true,
        answer_config: true,
        marks: true,
        difficulty: true
      }
    });

    const getCompositeKey = (q: any) => [
      String(q.grade || '').trim().toLowerCase(),
      String(q.section || '').trim().toLowerCase(),
      String(q.subject || '').trim().toLowerCase(),
      String(q.unit || '').trim().toLowerCase(),
      String(q.topic || '').trim().toLowerCase(),
      String(q.sub_topic || '').trim().toLowerCase(),
      String(q.question || '').trim().toLowerCase(),
      String(q.options || '').trim().toLowerCase(),
      String(q.answer || '').trim().toLowerCase(),
      String(q.marks || '').trim().toLowerCase(),
      String(q.difficulty || '').trim().toLowerCase()
    ].join('|');

    const dbQuestions = new Set(existingQuestions.map((q: any) => getCompositeKey({
      grade: q.grade?.name,
      section: q.section?.name,
      subject: q.subject?.name,
      unit: q.unit?.name,
      topic: q.topic?.name,
      sub_topic: q.sub_topic?.name,
      question: q.question_text,
      options: q.answer_config && typeof q.answer_config === 'object' && Array.isArray((q.answer_config as any).options) 
               ? (q.answer_config as any).options.map((o: any) => String(o).trim()).join(',') : '',
      answer: q.answer,
      marks: q.marks,
      difficulty: q.difficulty
    })));

    
    const allGrades = await prisma.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } });
    const allSections = await prisma.section.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
    const allSubjects = await prisma.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
    const allSyllabuses = await prisma.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } });
    const allUnitsRaw = await prisma.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } });
    const allTopics = await prisma.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });
    const allSubTopics = await prisma.subTopic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, topic_id: true } });

    const syllabusSubjectMap = new Map(allSyllabuses.map((sy: any) => [sy.id, sy.subject_id]));
    const unitsWithSubject = allUnitsRaw.map((u: any) => ({
      id: u.id, name: u.name,
      resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusSubjectMap.get(u.syllabus_id) ?? null : null)
    }));

    const findGrade = (name: any) => allGrades.find((g: any) => g.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSection = (name: any, grade_id: any) => allSections.find((s: any) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSubject = (name: any, grade_id: any) => allSubjects.find((s: any) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findUnit = (name: any, subject_id: any) => unitsWithSubject.find((u: any) => u.resolvedSubjectId === subject_id && u.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findTopic = (name: any, unit_id: any) => allTopics.find((t: any) => t.unit_id === unit_id && t.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSubTopic = (name: any, topic_id: any) => allSubTopics.find((st: any) => st.topic_id === topic_id && st.name.trim().toLowerCase() === String(name).trim().toLowerCase());

    const seenQuestions = new Set<string>();

    const resolvedRows = [];

    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      const rowNum = i + 2;

      const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
      if (isEmptyRow) continue;

      const errors: string[] = [];
      let match_status = 'NOT_VALID';

      const startsWithSpecialChar = (val: string) => val ? /^[^\p{L}\p{N}]/u.test(val) : false;

      if (!row.grade || String(row.grade).trim() === '') errors.push('Missing required field: "grade"');
      else if (startsWithSpecialChar(row.grade)) errors.push('Value must not start with a special character');

      if (!row.section || String(row.section).trim() === '') errors.push('Missing required field: "section"');
      else if (startsWithSpecialChar(row.section)) errors.push('Value must not start with a special character');

      if (!row.subject || String(row.subject).trim() === '') errors.push('Missing required field: "subject"');
      else if (startsWithSpecialChar(row.subject)) errors.push('Value must not start with a special character');

      if (!row.unit_lesson || String(row.unit_lesson).trim() === '') errors.push('Missing required field: "unit_lesson"');
      else if (startsWithSpecialChar(row.unit_lesson)) errors.push('Value must not start with a special character');

      if (!row.topic || String(row.topic).trim() === '') errors.push('Missing required field: "topic"');
      else if (startsWithSpecialChar(row.topic)) errors.push('Value must not start with a special character');

      if (row.sub_topic && startsWithSpecialChar(row.sub_topic)) errors.push('Value must not start with a special character');

      if (!row.question || String(row.question).trim() === '') errors.push('Missing required field: "question"');
      if (!row.option1 || String(row.option1).trim() === '') errors.push('Missing required field: "options"');
      if (!row.answer || String(row.answer).trim() === '') errors.push('Missing required field: "answer"');
      if (!row.marks) errors.push('Missing required field: "marks"');
      if (!row.difficulty_level) errors.push('Missing required field: "difficulty_level"');

      
      if (errors.length === 0) {
        const gradeName = String(row.grade).trim();
        const sectionName = String(row.section).trim();
        const subjectName = String(row.subject).trim();
        const unitName = String(row.unit_lesson).trim();
        const topicName = String(row.topic).trim();

        const grade = findGrade(gradeName);
        if (!grade) errors.push(`Hierarchy Error: Grade "${gradeName}" does not exist`);
        else {
          const section = findSection(sectionName, grade.id);
          if (!section) errors.push(`Hierarchy Error: Section "${sectionName}" does not exist in Grade "${gradeName}"`);

          const subject = findSubject(subjectName, grade.id);
          if (!subject) errors.push(`Hierarchy Error: Subject "${subjectName}" does not exist in Grade "${gradeName}"`);
          else {
            const unit = findUnit(unitName, subject.id);
            if (!unit) errors.push(`Hierarchy Error: Unit "${unitName}" does not exist in Subject "${subjectName}"`);
            else {
              const topic = findTopic(topicName, unit.id);
              if (!topic) errors.push(`Hierarchy Error: Topic "${topicName}" does not exist in Unit "${unitName}"`);
              else if (row.sub_topic && String(row.sub_topic).trim() !== '') {
                const subTopic = findSubTopic(String(row.sub_topic).trim(), topic.id);
                if (!subTopic) errors.push(`Hierarchy Error: SubTopic "${row.sub_topic}" does not exist in Topic "${topicName}"`);
              }
            }
          }
        }
      }

      if (errors.length === 0) {

        match_status = 'VALID';
        const csvOptions = [row.option1, row.option2, row.option3, row.option4].filter(Boolean).map(o => String(o).trim()).join(',');
        const compositeKey = getCompositeKey({
          grade: row.grade,
          section: row.section,
          subject: row.subject,
          unit: row.unit_lesson,
          topic: row.topic,
          sub_topic: row.sub_topic,
          question: row.question,
          options: csvOptions,
          answer: row.answer,
          marks: row.marks,
          difficulty: row.difficulty_level
        });

        const isDuplicate = seenQuestions.has(compositeKey) || dbQuestions.has(compositeKey);
        seenQuestions.add(compositeKey);

        if (isDuplicate) match_status = 'DUPLICATE';
      }

      resolvedRows.push({
        row_number: rowNum,
        raw_data: row,
        match_status,
        resolved_data: { errors }
      });
    }

    const previewData = resolvedRows.map((r) => ({
      session_id,
      organization_id: org_id,
      created_by: req.user.user_id,
      row_number: r.row_number,
      raw_data: r.raw_data,
      match_status: r.match_status,
      resolved_data: r.resolved_data
    }));

    await (prisma as any).previewImportData.createMany({ data: previewData });

    const summary = {
      total: resolvedRows.length,
      valid: resolvedRows.filter(r => r.match_status === 'VALID').length,
      duplicate: resolvedRows.filter(r => r.match_status === 'DUPLICATE').length,
      validation_error: resolvedRows.filter(r => r.match_status === 'NOT_VALID').length,
    };

    res.status(201).json({
      message: 'Preview generated successfully',
      session_id,
      summary,
      records: resolvedRows.map(r => ({
        ...r,
        created_by_name: req.user.name || 'System',
        created_date: new Date().toISOString()
      }))
    });
  } catch (error: any) {
    console.error('[Bulk Preview Error]', error);
    res.status(500).json({ message: 'Failed to process preview', error: error.message });
  }
});

// BULK DISCARD
router.post('/bulk/discard', requirePermission('QUESTION_BANK', 'IMPORT'), async (req: any, res: Response) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ message: 'Missing session_id' });
    
    const isGlobalAdmin = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
    const deleteWhere: any = { session_id, organization_id: req.user.organization_id };
    if (!isGlobalAdmin) {
      deleteWhere.created_by = req.user.user_id;
    }

    const deleteResult = await (prisma as any).previewImportData.deleteMany({ where: deleteWhere });
    if (deleteResult.count === 0 && !isGlobalAdmin) {
      return res.status(403).json({ message: 'You are not authorized to discard this preview session.' });
    }

    res.json({ message: 'Preview discarded' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to discard preview', error: error.message });
  }
});

// BULK CONFIRM (Takes session_id, reads from preview table, processes them)
router.post('/bulk/confirm', requirePermission('QUESTION_BANK', 'IMPORT'), async (req: any, res: Response) => {
  try {
    const { session_id, modified_records } = req.body;
    if (!session_id) return res.status(400).json({ message: 'Missing session_id' });

    const org_id = req.user.organization_id;
    const hasElevatedTenantAccess = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');
    let records: any[] = [];
    if (modified_records && Array.isArray(modified_records) && modified_records.length > 0) {
      records = modified_records;
    } else {
      const previewWhere: any = { session_id, organization_id: org_id };
      if (!hasElevatedTenantAccess) {
        previewWhere.created_by = req.user.user_id;
      }
      const previews = await (prisma as any).previewImportData.findMany({ where: previewWhere });
      if (!previews || previews.length === 0) return res.status(404).json({ message: 'Session not found or empty' });
      records = previews.map((p: any) => p.raw_data);
    }

    const activeYearId = await getActiveAcademicYearId(org_id);

    const allGrades = await prisma.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } });
    const allSections = await prisma.section.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
    const allSubjects = await prisma.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });
    const allSyllabuses = await prisma.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } });
    const allUnitsRaw = await prisma.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } });
    const allTopics = await prisma.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });
    const allSubTopics = await prisma.subTopic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, topic_id: true } });

    const syllabusSubjectMap = new Map(allSyllabuses.map((sy: any) => [sy.id, sy.subject_id]));
    const unitsWithSubject = allUnitsRaw.map((u: any) => ({
      id: u.id, name: u.name,
      resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusSubjectMap.get(u.syllabus_id) ?? null : null)
    }));

    
    const findGrade = (name: any) => allGrades.find((g: any) => g.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSection = (name: any, grade_id: any) => allSections.find((s: any) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSubject = (name: any, grade_id: any) => allSubjects.find((s: any) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findUnit = (name: any, subject_id: any) => unitsWithSubject.find((u: any) => u.resolvedSubjectId === subject_id && u.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findTopic = (name: any, unit_id: any) => allTopics.find((t: any) => t.unit_id === unit_id && t.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSubTopic = (name: any, topic_id: any) => allSubTopics.find((st: any) => st.topic_id === topic_id && st.name.trim().toLowerCase() === String(name).trim().toLowerCase());
  
    const results = { created: 0, skipped: 0, autoCreated: { grades: 0, subjects: 0, units: 0, topics: 0 }, errors: [] as string[] };
    const prevGradeCount = allGrades.length;
    const prevSubjectCount = allSubjects.length;
    const prevUnitCount = unitsWithSubject.length;
    const prevTopicCount = allTopics.length;


    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      const rowNum = i + 2;

      const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
      if (isEmptyRow) continue;

      try {
        const requiredFields = ['grade', 'section', 'subject', 'unit_lesson', 'topic', 'question', 'option1', 'answer', 'marks', 'difficulty_level'];
        for (const f of requiredFields) {
          if (!row[f] || String(row[f]).trim() === '') throw new Error(`Missing required field: "${f}"`);
        }

        const startsWithSpecialChar = (val: string) => val ? /^[^\p{L}\p{N}]/u.test(val) : false;
        const stringFieldsToCheck = ['grade', 'section', 'subject', 'unit_lesson', 'topic', 'sub_topic'];
        for (const f of stringFieldsToCheck) {
           const val = String(row[f] || '').trim();
           if (val && startsWithSpecialChar(val)) throw new Error(`Value for "${f}" must not start with a special character`);
        }

        const gradeName = String(row.grade).trim();
        const sectionName = String(row.section).trim();
        const subjectName = String(row.subject).trim();
        const unitName = String(row.unit_lesson).trim();
        const topicName = String(row.topic).trim();

        
        const grade = findGrade(gradeName);
        if (!grade) throw new Error(`Hierarchy Error: Grade "${gradeName}" does not exist`);

        const section = findSection(sectionName, grade.id);
        if (!section) throw new Error(`Hierarchy Error: Section "${sectionName}" does not exist in Grade "${gradeName}"`);

        const subject = findSubject(subjectName, grade.id);
        if (!subject) throw new Error(`Hierarchy Error: Subject "${subjectName}" does not exist in Grade "${gradeName}"`);

        const unit = findUnit(unitName, subject.id);
        if (!unit) throw new Error(`Hierarchy Error: Unit "${unitName}" does not exist in Subject "${subjectName}"`);

        const topic = findTopic(topicName, unit.id);
        if (!topic) throw new Error(`Hierarchy Error: Topic "${topicName}" does not exist in Unit "${unitName}"`);

        let subTopic: any = null;
        if (row.sub_topic && String(row.sub_topic).trim() !== '') {
          subTopic = findSubTopic(String(row.sub_topic).trim(), topic.id);
          if (!subTopic) throw new Error(`Hierarchy Error: SubTopic "${row.sub_topic}" does not exist in Topic "${topicName}"`);
        }
  

        let rawType = String(row.question_type || 'MCQ_SINGLE').trim().toUpperCase();
        if (rawType === 'MCQ') rawType = 'MCQ_SINGLE';
        const validTypes = ['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO', 'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING', 'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER'];
        if (!validTypes.includes(rawType)) throw new Error(`Invalid question_type: "${rawType}". Valid: ${validTypes.join(', ')}`);

        const answer_config = buildAnswerConfig(rawType, row);
        try { validateConfig(rawType, answer_config); } catch {
          throw new Error(`Invalid answer config for type "${rawType}". Check option1-4 and answer columns.`);
        }

        let diff = String(row.difficulty_level || '').trim().toUpperCase();
        if (diff === 'HARD LEVEL') diff = 'HARD';
        else if (diff === 'EASY LEVEL') diff = 'EASY';
        else if (diff === 'MEDIUM LEVEL') diff = 'MEDIUM';
        if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) diff = 'MEDIUM';

        const marks = parseInt(row.marks, 10);
        if (isNaN(marks) || marks < 1) throw new Error(`Invalid marks: "${row.marks}". Must be a positive integer.`);

        if (!hasElevatedTenantAccess && subject) {
          const canAccess = await hasSubjectAccess(req.user.user_id, subject.id, org_id);
          if (!canAccess) throw new Error(`Not authorized to upload questions for subject "${subjectName}"`);
        }

        await prisma.question.create({
          data: {
            grade_id: grade?.id || undefined,
            section_id: section?.id || undefined,
            subject_id: subject?.id || undefined,
            unit_id: unit?.id || undefined,
            topic_id: topic?.id || undefined,
            sub_topic_id: subTopic?.id || undefined,
            question_text: String(row.question).trim(),
            type: rawType as any,
            answer: row.answer ? String(row.answer).trim() : undefined,
            answer_config,
            marks,
            difficulty: diff as any,
            is_important: String(row.important_question || 'false').toLowerCase() === 'true',
            is_repeated: String(row.repeated_question || 'false').toLowerCase() === 'true',
            organization_id: org_id,
            created_by: req.user.user_id
          }
        });
        results.created++;
      } catch (err: any) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
      }
    }

    results.autoCreated.grades = allGrades.length - prevGradeCount;
    results.autoCreated.subjects = allSubjects.length - prevSubjectCount;
    results.autoCreated.units = unitsWithSubject.length - prevUnitCount;
    results.autoCreated.topics = allTopics.length - prevTopicCount;

    // Delete the preview records now that they are processed
    const deleteWhere: any = { session_id, organization_id: org_id };
    if (!hasElevatedTenantAccess) deleteWhere.created_by = req.user.user_id;
    await (prisma as any).previewImportData.deleteMany({ where: deleteWhere });

    await logAuditEvent({
      organization_id: org_id,
      user_id: req.user.user_id,
      user_name: req.user.name,
      action_type: 'IMPORT',
      entity_type: 'QUESTION',
      entity_id: session_id,
      metadata: { success_count: results.created, skipped_count: results.skipped }
    });

    const autoMsg = Object.entries(results.autoCreated)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');

    res.status(201).json({
      message: `Bulk import confirmed. ${results.created} questions created, ${results.skipped} skipped.${autoMsg ? ` Auto-created: ${autoMsg}.` : ''}`,
      results
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to confirm bulk import', error: error.message });
  }
});

// BULK UPLOAD (CSV Parse) — auto-creates missing academic hierarchy
router.post('/bulk', requirePermission('QUESTION_BANK', 'IMPORT'), upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    if (!records || records.length === 0) return res.status(400).json({ message: 'Empty or invalid CSV spreadsheet' });

    const org_id = req.user.organization_id;
    const hasElevatedTenantAccess = req.user.permissions?.includes('IDENTITY:IS_MANAGEMENT') || req.user.permissions?.includes('IDENTITY:IS_SUPER_ADMIN');

    const activeYearId = await getActiveAcademicYearId(org_id);

    // ── Pre-fetch all org-scoped academic data (mutable arrays — updated as we create) ──
    const allGrades: { id: string; name: string }[] =
      await prisma.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } });

    const allSubjects: { id: string; name: string; grade_id: string }[] =
      await prisma.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } });

    const allSyllabuses: { id: string; subject_id: string }[] =
      await prisma.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } });

    const allUnitsRaw: { id: string; name: string; subject_id: string | null; syllabus_id: string | null }[] =
      await prisma.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } });

    const allTopics: { id: string; name: string; unit_id: string }[] =
      await prisma.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } });

    // Resolve subject_id for units linked via syllabus
    const syllabusSubjectMap = new Map<string, string>(
      allSyllabuses.map(sy => [sy.id, sy.subject_id])
    );
    const unitsWithSubject: { id: string; name: string; resolvedSubjectId: string | null }[] =
      allUnitsRaw.map(u => ({
        id: u.id, name: u.name,
        resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusSubjectMap.get(u.syllabus_id) ?? null : null)
      }));

    const findGrade = (name: any) => allGrades.find((g: any) => g.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findSubject = (name: any, grade_id: any) => allSubjects.find((s: any) => s.grade_id === grade_id && s.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findUnit = (name: any, subject_id: any) => unitsWithSubject.find((u: any) => u.resolvedSubjectId === subject_id && u.name.trim().toLowerCase() === String(name).trim().toLowerCase());
    const findTopic = (name: any, unit_id: any) => allTopics.find((t: any) => t.unit_id === unit_id && t.name.trim().toLowerCase() === String(name).trim().toLowerCase());

    // ── Process rows ──────────────────────────────────────────────────────────
    const results = { created: 0, skipped: 0, autoCreated: { grades: 0, subjects: 0, units: 0, topics: 0 }, errors: [] as string[] };
    const prevGradeCount = allGrades.length;
    const prevSubjectCount = allSubjects.length;
    const prevUnitCount = unitsWithSubject.length;
    const prevTopicCount = allTopics.length;

    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      const rowNum = i + 2; // row 1 = header

      const isEmptyRow = Object.values(row).every(val => !val || String(val).trim() === '');
      if (isEmptyRow) continue;

      try {
        // ── Required field checks ────────────────────────────────────────────
        const requiredFields = ['grade', 'subject', 'unit_lesson', 'topic', 'question', 'marks', 'difficulty_level'];
        for (const f of requiredFields) {
          if (!row[f] || String(row[f]).trim() === '') throw new Error(`Missing required field: "${f}"`);
        }

        const gradeName = String(row.grade).trim();
        const subjectName = String(row.subject).trim();
        const unitName = String(row.unit_lesson).trim();
        const topicName = String(row.topic).trim();

        // ── Auto-resolve or auto-create academic hierarchy ───────────────────
        
        const grade = findGrade(gradeName);
        if (!grade) throw new Error(`Hierarchy Error: Grade "${gradeName}" does not exist`);

        const subject = findSubject(subjectName, grade.id);
        if (!subject) throw new Error(`Hierarchy Error: Subject "${subjectName}" does not exist in Grade "${gradeName}"`);

        const unit = findUnit(unitName, subject.id);
        if (!unit) throw new Error(`Hierarchy Error: Unit "${unitName}" does not exist in Subject "${subjectName}"`);

        const topic = findTopic(topicName, unit.id);
        if (!topic) throw new Error(`Hierarchy Error: Topic "${topicName}" does not exist in Unit "${unitName}"`);
  

        // ── Type & Config ────────────────────────────────────────────────────
        let rawType = String(row.question_type || 'MCQ_SINGLE').trim().toUpperCase();
        if (rawType === 'MCQ') rawType = 'MCQ_SINGLE';
        const validTypes = ['MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO', 'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING', 'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER'];
        if (!validTypes.includes(rawType)) throw new Error(`Invalid question_type: "${rawType}". Valid: ${validTypes.join(', ')}`);

        const answer_config = buildAnswerConfig(rawType, row);
        try { validateConfig(rawType, answer_config); } catch {
          throw new Error(`Invalid answer config for type "${rawType}". Check option1-4 and answer columns.`);
        }

        // ── Difficulty & Marks ───────────────────────────────────────────────
        let diff = String(row.difficulty_level || '').trim().toUpperCase();
        if (diff === 'HARD LEVEL') diff = 'HARD';
        else if (diff === 'EASY LEVEL') diff = 'EASY';
        else if (diff === 'MEDIUM LEVEL') diff = 'MEDIUM';
        if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) diff = 'MEDIUM';

        const marks = parseInt(row.marks, 10);
        if (isNaN(marks) || marks < 1) throw new Error(`Invalid marks: "${row.marks}". Must be a positive integer.`);

        // ── Teacher access check ─────────────────────────────────────────────
        if (!hasElevatedTenantAccess && subject) {
          const canAccess = await hasSubjectAccess(req.user.user_id, subject.id, org_id);
          if (!canAccess) throw new Error(`Not authorized to upload questions for subject "${subjectName}"`);
        }

        await prisma.question.create({
          data: {
            grade_id: grade?.id || undefined,
            subject_id: subject?.id || undefined,
            unit_id: unit?.id || undefined,
            topic_id: topic?.id || undefined,
            question_text: String(row.question).trim(),
            type: rawType as any,
            answer: row.answer ? String(row.answer).trim() : undefined,
            answer_config,
            marks,
            difficulty: diff as any,
            is_important: String(row.important_question || 'false').toLowerCase() === 'true',
            is_repeated: String(row.repeated_question || 'false').toLowerCase() === 'true',
            organization_id: org_id,
            created_by: req.user.user_id
          }
        });
        results.created++;

      } catch (err: any) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
      }
    }

    // Count auto-created items
    results.autoCreated.grades = allGrades.length - prevGradeCount;
    results.autoCreated.subjects = allSubjects.length - prevSubjectCount;
    results.autoCreated.units = unitsWithSubject.length - prevUnitCount;
    results.autoCreated.topics = allTopics.length - prevTopicCount;

    const autoMsg = Object.entries(results.autoCreated)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');

    res.status(201).json({
      message: `Bulk upload completed. ${results.created} questions created, ${results.skipped} skipped.${autoMsg ? ` Auto-created: ${autoMsg}.` : ''}`,
      results
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to process file', error: error.message });
  }
});

export default router;
