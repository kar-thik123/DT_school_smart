import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import prisma from '../prisma';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../middlewares/auth.middleware';
import { checkTeacherSubjectAccess } from '../services/academic-compatibility.service';

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
    const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);

    if (!isGlobalAdmin) {
      if (parsed.subject_id) {
        const canAccess = await hasSubjectAccess(req.user.user_id, parsed.subject_id, org_id);
        if (!canAccess) return res.status(403).json({ message: 'Teacher is not assigned to this subject or grade' });
      }
    }

    const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, parsed.sub_topic_id, org_id);
    if (!isValidHierarchy) return res.status(400).json({ message: 'Invalid hierarchy: subject -> unit -> topic -> sub_topic mismatch' });

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

    res.status(201).json({ message: 'Question created', question });
  } catch (error: any) {
    if (error?.errors) return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    res.status(500).json({ message: 'Server Error' });
  }
});

// READ QUESTIONS
router.get('/', requirePermission('QUESTION_BANK', 'READ'), async (req: any, res: Response) => {
  try {
    const { grade_id, subject_id, difficulty } = req.query;
    const filter: any = { organization_id: req.user.organization_id };
    if (subject_id) filter.subject_id = String(subject_id);
    if (difficulty) filter.difficulty = String(difficulty);
    if (grade_id) {
       filter.OR = [
         { grade_id: String(grade_id) },
         { subject: { grade_id: String(grade_id) } }
       ];
    }

    const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
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
      orderBy: { created_at: 'desc' },
      take: 100 // pagination placeholder
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

    const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
    if (!isGlobalAdmin && existing.created_by !== req.user.user_id) {
       return res.status(403).json({ message: 'Only creator or admins can edit' });
    }

    const parsed = questionSchema.parse(req.body);
    const isValidHierarchy = await validateHierarchy(parsed.subject_id, parsed.unit_id, parsed.topic_id, parsed.sub_topic_id, org_id);
    if (!isValidHierarchy) return res.status(400).json({ message: 'Invalid hierarchy' });

    const updated = await prisma.question.update({
      where: { id: existing.id },
      data: parsed
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
    
    await prisma.question.delete({ where: { id: existing.id } });
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

// BULK UPLOAD (CSV Parse) — auto-creates missing academic hierarchy
router.post('/bulk', requirePermission('QUESTION_BANK', 'IMPORT'), upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    if (!records || records.length === 0) return res.status(400).json({ message: 'Empty or invalid CSV spreadsheet' });

    const org_id = req.user.organization_id;
    const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);

    // ── Resolve active academic year (needed if we must create a grade) ────────
    let activeYear = await prisma.academicYear.findFirst({
      where: { organization_id: org_id, is_active: true }
    });
    if (!activeYear) {
      const now = new Date();
      activeYear = await prisma.academicYear.create({
        data: { name: `${now.getFullYear()}-${now.getFullYear() + 1}`, organization_id: org_id, is_active: true }
      });
    }
    const activeYearId = activeYear.id;

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

    // ── findOrCreate helpers — check in-memory cache first, create in DB if missing ──

    const findOrCreateGrade = async (name: string) => {
      const found = allGrades.find(g => normalizeGradeName(g.name) === normalizeGradeName(name));
      if (found) return found;
      // Create and cache
      const record = await prisma.grade.create({
        data: { name: name.trim(), academic_year_id: activeYearId, organization_id: org_id }
      });
      const entry = { id: record.id, name: record.name };
      allGrades.push(entry);
      return entry;
    };

    const findOrCreateSubject = async (name: string, grade_id: string) => {
      const found = allSubjects.find(s => s.grade_id === grade_id && fuzzyMatch(s.name, name));
      if (found) return found;
      const record = await prisma.subject.create({
        data: { name: name.trim(), grade_id, organization_id: org_id }
      });
      const entry = { id: record.id, name: record.name, grade_id: record.grade_id };
      allSubjects.push(entry);
      return entry;
    };

    const findOrCreateUnit = async (name: string, subject_id: string) => {
      const found = unitsWithSubject.find(u => u.resolvedSubjectId === subject_id && fuzzyMatch(u.name, name));
      if (found) return found;
      const record = await prisma.unit.create({
        data: { name: name.trim(), subject_id, organization_id: org_id }
      });
      const entry = { id: record.id, name: record.name, resolvedSubjectId: subject_id };
      unitsWithSubject.push(entry);
      return entry;
    };

    const findOrCreateTopic = async (name: string, unit_id: string) => {
      const found = allTopics.find(t => t.unit_id === unit_id && fuzzyMatch(t.name, name));
      if (found) return found;
      const record = await prisma.topic.create({
        data: { name: name.trim(), unit_id, organization_id: org_id }
      });
      const entry = { id: record.id, name: record.name, unit_id: record.unit_id };
      allTopics.push(entry);
      return entry;
    };

    // ── Process rows ──────────────────────────────────────────────────────────
    const results = { created: 0, skipped: 0, autoCreated: { grades: 0, subjects: 0, units: 0, topics: 0 }, errors: [] as string[] };
    const prevGradeCount    = allGrades.length;
    const prevSubjectCount  = allSubjects.length;
    const prevUnitCount     = unitsWithSubject.length;
    const prevTopicCount    = allTopics.length;

    for (let i = 0; i < records.length; i++) {
      const row: any = records[i];
      const rowNum = i + 2; // row 1 = header

      try {
        // ── Required field checks ────────────────────────────────────────────
        const requiredFields = ['grade', 'subject', 'unit_lesson', 'topic', 'question', 'marks', 'difficulty_level'];
        for (const f of requiredFields) {
          if (!row[f] || String(row[f]).trim() === '') throw new Error(`Missing required field: "${f}"`);
        }

        const gradeName   = String(row.grade).trim();
        const subjectName = String(row.subject).trim();
        const unitName    = String(row.unit_lesson).trim();
        const topicName   = String(row.topic).trim();

        // ── Auto-resolve or auto-create academic hierarchy ───────────────────
        const grade   = await findOrCreateGrade(gradeName);
        const subject = await findOrCreateSubject(subjectName, grade.id);
        const unit    = await findOrCreateUnit(unitName, subject.id);
        const topic   = await findOrCreateTopic(topicName, unit.id);

        // ── Type & Config ────────────────────────────────────────────────────
        let rawType = String(row.question_type || 'MCQ_SINGLE').trim().toUpperCase();
        if (rawType === 'MCQ') rawType = 'MCQ_SINGLE';
        const validTypes = ['MCQ_SINGLE','MCQ_MULTI','TRUE_FALSE','YES_NO','FILL_BLANK','DRAG_DROP_FILL','MATCH_FOLLOWING','DRAG_DROP_MATCH','SENTENCE_ORDER','STRUCTURED_2MARK','STRUCTURED_5MARK','LONG_ANSWER'];
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
        if (!isGlobalAdmin) {
          const canAccess = await hasSubjectAccess(req.user.user_id, subject.id, org_id);
          if (!canAccess) throw new Error(`Not authorized to upload questions for subject "${subjectName}"`);
        }

        await prisma.question.create({
          data: {
            grade_id:        grade.id,
            subject_id:      subject.id,
            unit_id:         unit.id,
            topic_id:        topic.id,
            question_text:   String(row.question).trim(),
            type:            rawType as any,
            answer:          row.answer ? String(row.answer).trim() : undefined,
            answer_config,
            marks,
            difficulty:      diff as any,
            is_important:    String(row.important_question || 'false').toLowerCase() === 'true',
            is_repeated:     String(row.repeated_question || 'false').toLowerCase() === 'true',
            organization_id: org_id,
            created_by:      req.user.user_id
          }
        });
        results.created++;

      } catch (err: any) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
      }
    }

    // Count auto-created items
    results.autoCreated.grades   = allGrades.length - prevGradeCount;
    results.autoCreated.subjects = allSubjects.length - prevSubjectCount;
    results.autoCreated.units    = unitsWithSubject.length - prevUnitCount;
    results.autoCreated.topics   = allTopics.length - prevTopicCount;

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


