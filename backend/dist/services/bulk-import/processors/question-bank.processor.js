"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankProcessor = void 0;
const prisma_1 = __importDefault(require("../../../prisma"));
// Valid enum values from the Prisma schema
const VALID_QUESTION_TYPES = [
    'MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'YES_NO',
    'FILL_BLANK', 'DRAG_DROP_FILL', 'MATCH_FOLLOWING',
    'DRAG_DROP_MATCH', 'SENTENCE_ORDER', 'STRUCTURED_2MARK',
    'STRUCTURED_5MARK', 'LONG_ANSWER'
];
const VALID_DIFFICULTY = ['EASY', 'MEDIUM', 'HARD'];
// Question types that require MCQ-style options
const MCQ_TYPES = ['MCQ_SINGLE', 'MCQ_MULTI'];
// Question types that require correct_answer but no options
const TEXT_ANSWER_TYPES = ['STRUCTURED_2MARK', 'STRUCTURED_5MARK', 'LONG_ANSWER', 'FILL_BLANK', 'DRAG_DROP_FILL'];
// Match-based question types
const MATCH_TYPES = ['MATCH_FOLLOWING', 'DRAG_DROP_MATCH'];
class QuestionBankProcessor {
    organizationId;
    userId;
    resolved = {
        grades: {},
        subjects: {},
        units: {},
        topics: {}
    };
    fileUniqueSet = new Set();
    constructor(organizationId, userId) {
        this.organizationId = organizationId;
        this.userId = userId;
    }
    async resolveRelations(rows) {
        const gradeNames = Array.from(new Set(rows.map((r) => r.grade_name?.trim()).filter(Boolean)));
        const subjectNames = Array.from(new Set(rows.map((r) => r.subject_name?.trim()).filter(Boolean)));
        const unitNames = Array.from(new Set(rows.map((r) => r.unit_name?.trim()).filter(Boolean)));
        const topicNames = Array.from(new Set(rows.map((r) => r.topic_name?.trim()).filter(Boolean)));
        // 4 parallel batch DB queries — never per-row
        const [grades, subjects, units, topics] = await Promise.all([
            prisma_1.default.grade.findMany({
                where: { organization_id: this.organizationId, name: { in: gradeNames } },
                select: { id: true, name: true }
            }),
            prisma_1.default.subject.findMany({
                where: { organization_id: this.organizationId, name: { in: subjectNames } },
                select: { id: true, name: true, grade_id: true }
            }),
            prisma_1.default.unit.findMany({
                where: { organization_id: this.organizationId, name: { in: unitNames } },
                select: { id: true, name: true, subject_id: true }
            }),
            prisma_1.default.topic.findMany({
                where: { organization_id: this.organizationId, name: { in: topicNames } },
                select: { id: true, name: true, unit_id: true }
            })
        ]);
        // Build hierarchical lookup maps (composite keys to prevent cross-scope collisions forced to lowercase)
        this.resolved.grades = Object.fromEntries(grades.map((g) => [g.name.trim().toLowerCase(), g]));
        this.resolved.subjects = Object.fromEntries(subjects.map((s) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
        this.resolved.units = Object.fromEntries(units.map((u) => [`${u.subject_id}_${u.name.trim().toLowerCase()}`, u]));
        this.resolved.topics = Object.fromEntries(topics.map((t) => [`${t.unit_id}_${t.name.trim().toLowerCase()}`, t]));
        return this.resolved;
    }
    async validateRow(row) {
        const questionType = row.question_type?.trim().toUpperCase();
        const rawGrade = row.grade_name;
        const rawSubject = row.subject_name;
        const rawUnit = row.unit_name;
        const rawTopic = row.topic_name;
        const gradeName = rawGrade?.trim().toLowerCase();
        const subjectName = rawSubject?.trim().toLowerCase();
        const unitName = rawUnit?.trim().toLowerCase();
        const topicName = rawTopic?.trim().toLowerCase();
        const questionText = row.question_text?.trim();
        const optionA = row.option_a?.trim() || '';
        const optionB = row.option_b?.trim() || '';
        const optionC = row.option_c?.trim() || '';
        const optionD = row.option_d?.trim() || '';
        const correctAnswer = row.correct_answer?.trim() || '';
        const matchPairs = row.match_pairs?.trim() || '';
        const marksRaw = row.marks?.trim();
        const difficultyRaw = row.difficulty?.trim().toUpperCase() || 'MEDIUM';
        const errors = [];
        // ── 1. Core Required Fields ─────────────────────────────────────────────
        if (!questionType)
            errors.push('Missing question_type');
        if (!questionText)
            errors.push('Missing question_text');
        if (!gradeName)
            errors.push('Missing grade_name');
        if (!subjectName)
            errors.push('Missing subject_name');
        if (!unitName)
            errors.push('Missing unit_name');
        if (!topicName)
            errors.push('Missing topic_name');
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        // ── 2. Enum validation ──────────────────────────────────────────────────
        if (!VALID_QUESTION_TYPES.includes(questionType)) {
            errors.push(`Invalid question_type '${questionType}'. Valid: ${VALID_QUESTION_TYPES.join(', ')}`);
        }
        if (!VALID_DIFFICULTY.includes(difficultyRaw)) {
            errors.push(`Invalid difficulty '${difficultyRaw}'. Must be EASY, MEDIUM or HARD.`);
        }
        const marks = parseInt(marksRaw, 10);
        if (isNaN(marks) || marks < 1) {
            errors.push(`Invalid marks '${marksRaw}'. Must be a positive integer.`);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        // ── 3. Hierarchical Relation Map ────────────────────────────────────────
        const grade = this.resolved.grades[gradeName];
        if (!grade)
            errors.push(`Grade '${rawGrade}' not found.`);
        let subject, unit, topic;
        if (grade) {
            subject = this.resolved.subjects[`${grade.id}_${subjectName}`];
            if (!subject)
                errors.push(`Subject '${rawSubject}' not found under Grade '${rawGrade}'.`);
        }
        if (subject) {
            unit = this.resolved.units[`${subject.id}_${unitName}`];
            if (!unit)
                errors.push(`Unit '${rawUnit}' not found under Subject '${rawSubject}'.`);
        }
        if (unit) {
            topic = this.resolved.topics[`${unit.id}_${topicName}`];
            if (!topic)
                errors.push(`Topic '${rawTopic}' not found under Unit '${rawUnit}'.`);
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        // ── 4. Conditional Type-Specific Validation ─────────────────────────────
        let answerConfig = {};
        if (MCQ_TYPES.includes(questionType)) {
            if (!optionA || !optionB)
                errors.push('MCQ questions require at least option_a and option_b.');
            if (!correctAnswer)
                errors.push('MCQ questions require correct_answer.');
            const options = [optionA, optionB, optionC, optionD].filter(Boolean);
            // For MCQ_SINGLE the correct answer must be one of the options
            if (questionType === 'MCQ_SINGLE' && correctAnswer && !options.includes(correctAnswer)) {
                errors.push(`correct_answer '${correctAnswer}' must match one of the provided options.`);
            }
            // For MCQ_MULTI, correct_answer is a pipe-separated list
            if (questionType === 'MCQ_MULTI' && correctAnswer) {
                const answers = correctAnswer.split('|').map((s) => s.trim());
                const invalid = answers.filter((a) => !options.includes(a));
                if (invalid.length > 0) {
                    errors.push(`MCQ_MULTI correct_answer values not found in options: ${invalid.join(', ')}`);
                }
            }
            answerConfig = { options };
        }
        if (questionType === 'TRUE_FALSE' || questionType === 'YES_NO') {
            const acceptable = questionType === 'TRUE_FALSE' ? ['True', 'False', 'TRUE', 'FALSE'] : ['Yes', 'No', 'YES', 'NO'];
            if (!correctAnswer || !acceptable.map((a) => a.toLowerCase()).includes(correctAnswer.toLowerCase())) {
                errors.push(`${questionType} requires correct_answer to be one of: ${acceptable.join(', ')}`);
            }
        }
        if (TEXT_ANSWER_TYPES.includes(questionType)) {
            if (!correctAnswer)
                errors.push(`${questionType} requires a correct_answer (model answer).`);
        }
        if (MATCH_TYPES.includes(questionType)) {
            if (!matchPairs) {
                errors.push(`${questionType} requires match_pairs (e.g. "A-1,B-2,C-3").`);
            }
            else {
                // Validate format: each pair must be "X-Y"
                const pairs = matchPairs.split(',').map((p) => p.trim());
                const badPairs = pairs.filter((p) => !p.includes('-'));
                if (badPairs.length > 0) {
                    errors.push(`Invalid match_pairs format. Each item must be "Left-Right" separated by "-". Bad: ${badPairs.join(', ')}`);
                }
                answerConfig = { pairs };
            }
        }
        if (questionType === 'SENTENCE_ORDER') {
            // Sentences stored in options A-D; correct_answer is the ordered sequence e.g. "B,A,D,C"
            if (!correctAnswer)
                errors.push('SENTENCE_ORDER requires correct_answer (ordering sequence e.g. B,A,D,C).');
            answerConfig = { sentences: [optionA, optionB, optionC, optionD].filter(Boolean) };
        }
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        // ── 5. Intra-file Duplicate Detection ───────────────────────────────────
        const uniqueKey = `${questionText.substring(0, 60)}_${topic.id}`;
        if (this.fileUniqueSet.has(uniqueKey)) {
            errors.push(`Duplicate question text detected for topic '${topicName}' in this file.`);
        }
        this.fileUniqueSet.add(uniqueKey);
        if (errors.length > 0)
            return { status: 'ERROR', errors, data: row };
        // ── 6. Pass resolved IDs and computed config for commit ─────────────────
        return {
            status: 'VALID',
            data: {
                ...row,
                resolved_subject_id: subject.id,
                resolved_unit_id: unit.id,
                resolved_topic_id: topic.id,
                resolved_type: questionType,
                resolved_marks: marks,
                resolved_difficulty: difficultyRaw,
                resolved_answer: correctAnswer || null,
                resolved_answer_config: answerConfig
            }
        };
    }
    async commit(validRows) {
        const result = await prisma_1.default.$transaction(async (tx) => {
            let success = 0;
            let failure = 0;
            for (const row of validRows) {
                try {
                    // Check for existing question with same text in same topic (DB-level deduplicate)
                    const existing = await tx.question.findFirst({
                        where: {
                            question_text: row.question_text.trim(),
                            topic_id: row.resolved_topic_id,
                            organization_id: this.organizationId
                        }
                    });
                    if (existing) {
                        // Skip silently — already exists, idempotency preserved
                        success++;
                        continue;
                    }
                    await tx.question.create({
                        data: {
                            organization_id: this.organizationId,
                            created_by: this.userId,
                            subject_id: row.resolved_subject_id,
                            unit_id: row.resolved_unit_id,
                            topic_id: row.resolved_topic_id,
                            question_text: row.question_text.trim(),
                            type: row.resolved_type,
                            marks: row.resolved_marks,
                            difficulty: row.resolved_difficulty,
                            answer: row.resolved_answer,
                            answer_config: row.resolved_answer_config || {}
                        }
                    });
                    success++;
                }
                catch (e) {
                    console.error('[Bulk-QuestionBank-Commit] Row failed:', e);
                    failure++;
                }
            }
            return { success, failure };
        });
        return { success_count: result.success, failure_count: result.failure };
    }
}
exports.QuestionBankProcessor = QuestionBankProcessor;
