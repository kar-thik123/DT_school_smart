"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// A helper function to create generic CRUD handlers
const createCrudHandlers = (modelName, prismaModel) => {
    const modelRouter = (0, express_1.Router)();
    // Read
    modelRouter.get('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
        try {
            const hasSortOrder = ['Section', 'Unit', 'Topic'].includes(modelName);
            const data = await prismaModel.findMany({
                where: { organization_id: req.user.organization_id },
                ...(hasSortOrder ? { orderBy: { sort_order: 'asc' } } : {})
            });
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ message: `Error fetching ${modelName}` });
        }
    });
    // Create
    modelRouter.post('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
        try {
            const data = await prismaModel.create({
                data: { ...req.body, organization_id: req.user.organization_id }
            });
            res.status(201).json({ message: `${modelName} created`, data });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating ${modelName}`, error: error.message });
        }
    });
    // Edit (Update)
    modelRouter.put('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
        try {
            // If ID is not a valid UUID, findFirst will throw Prisma error in some environments, or we check existence
            const existing = await prismaModel.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
            if (!existing)
                return res.status(404).json({ message: 'Not found' });
            // const data = await prismaModel.update({
            //   where: { id: req.params.id },
            //   data: req.body
            // Security Fix: Prevent cross-tenant data leakage by ensuring organization_id cannot be overwritten
            const { id, organization_id, ...safeData } = req.body;
            const data = await prismaModel.update({
                where: { id: req.params.id },
                data: safeData
            });
            res.json({ message: `${modelName} updated`, data });
        }
        catch (error) {
            // Prisma error for invalid ID format or record not found
            if (error.code === 'P2023' || error.code === 'P2025' || error.message?.includes('invalid input syntax for type uuid')) {
                return res.status(404).json({ message: 'Not found' });
            }
            console.error(`Error updating ${modelName}:`, error);
            res.status(400).json({ message: `Error updating ${modelName}`, error: error.message });
        }
    });
    // Delete
    modelRouter.delete('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
        try {
            const existing = await prismaModel.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
            if (!existing)
                return res.status(404).json({ message: 'Not found' });
            await prismaModel.delete({ where: { id: req.params.id } });
            res.json({ message: `${modelName} deleted` });
        }
        catch (error) {
            if (error.code === 'P2023' || error.code === 'P2025' || error.message?.includes('invalid input syntax for type uuid')) {
                return res.status(404).json({ message: 'Not found' });
            }
            console.error(`Error deleting ${modelName}:`, error);
            res.status(400).json({ message: `Error deleting ${modelName}`, error: error.message });
        }
    });
    return modelRouter;
};
// Registering all generic CRUD routes
router.use('/boards', createCrudHandlers('Board', prisma_1.default.board));
router.use('/mediums', createCrudHandlers('Medium', prisma_1.default.medium));
router.use('/organization-types', createCrudHandlers('OrganizationType', prisma_1.default.organizationType));
router.use('/academic-years', createCrudHandlers('AcademicYear', prisma_1.default.academicYear));
// ── Generic Reorder Endpoint ────────────────────────────────────────────────
router.put('/reorder/:model', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { model } = req.params;
        const { items } = req.body; // Array of { id, sort_order }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid payload: items array required' });
        }
        const validModels = {
            grades: prisma_1.default.grade,
            sections: prisma_1.default.section,
            subjects: prisma_1.default.subject
        };
        const prismaModel = validModels[model.toLowerCase()];
        if (!prismaModel)
            return res.status(400).json({ message: 'Invalid model for reordering' });
        await prisma_1.default.$transaction(items.map((item) => prismaModel.update({
            where: { id: item.id },
            data: { sort_order: item.sort_order }
        })));
        res.json({ message: 'Reordered successfully' });
    }
    catch (error) {
        res.status(400).json({ message: 'Error reordering items', error: error.message });
    }
});
// ── Grades: custom handler — auto-resolves academic_year_id ──────────────────
const gradeRouter = (0, express_1.Router)();
gradeRouter.get('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const data = await prisma_1.default.grade.findMany({
            where: { organization_id: req.user.organization_id },
            include: { academic_year: true },
            orderBy: { sort_order: 'asc' }
        });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching Grades' });
    }
});
gradeRouter.get('/assigned', async (req, res) => {
    try {
        const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
        if (isGlobalAdmin) {
            const data = await prisma_1.default.grade.findMany({
                where: { organization_id: req.user.organization_id },
                include: { academic_year: true },
                orderBy: { sort_order: 'asc' }
            });
            return res.json(data);
        }
        // For teachers
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: {
                teacher_id: req.user.user_id,
                organization_id: req.user.organization_id
            },
            include: { grade: { include: { academic_year: true } } }
        });
        // Deduplicate grades
        const gradesMap = new Map();
        assignments.forEach((a) => {
            if (a.grade && !gradesMap.has(a.grade_id)) {
                gradesMap.set(a.grade_id, a.grade);
            }
        });
        res.json(Array.from(gradesMap.values()));
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching assigned Grades' });
    }
});
gradeRouter.post('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const rawName = req.body.name;
        if (!rawName)
            return res.status(400).json({ message: 'Grade name is required' });
        // Normalize: strip leading "Grade " so "Grade 10" and "10" map to the same DB record
        const name = String(rawName).replace(/^grade\s*/i, '').trim();
        const { academic_year_id } = req.body;
        let yearId = academic_year_id;
        if (!yearId) {
            // Auto-resolve: use the active academic year, or create a default one
            let activeYear = await prisma_1.default.academicYear.findFirst({
                where: { organization_id: req.user.organization_id, is_active: true }
            });
            if (!activeYear) {
                const now = new Date();
                const yearLabel = `${now.getFullYear()}-${now.getFullYear() + 1}`;
                activeYear = await prisma_1.default.academicYear.create({
                    data: {
                        name: yearLabel,
                        organization_id: req.user.organization_id,
                        is_active: true
                    }
                });
            }
            yearId = activeYear.id;
        }
        const data = await prisma_1.default.grade.create({
            data: { name, academic_year_id: yearId, organization_id: req.user.organization_id }
        });
        res.status(201).json({ message: 'Grade created', data });
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating Grade', error: error.message });
    }
});
gradeRouter.put('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const existing = await prisma_1.default.grade.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        const data = await prisma_1.default.grade.update({ where: { id: req.params.id }, data: { name: req.body.name } });
        res.json({ message: 'Grade updated', data });
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating Grade', error: error.message });
    }
});
gradeRouter.delete('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const existing = await prisma_1.default.grade.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        await prisma_1.default.$transaction(async (tx) => {
            // Unlink users to prevent FK constraint error before cascade
            await tx.user.updateMany({
                where: { grade_id: req.params.id, organization_id: req.user.organization_id },
                data: { grade_id: null, section_id: null }
            });
            await tx.grade.delete({ where: { id: req.params.id } });
        });
        res.json({ message: 'Grade deleted' });
    }
    catch (error) {
        res.status(400).json({ message: 'Error deleting Grade', error: error.message });
    }
});
router.use('/grades', gradeRouter);
// ── Section Allocation ────────────────────────────────────────────────────────
router.put('/sections/allocate', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { grade_id, allocations } = req.body;
        if (!grade_id || !Array.isArray(allocations)) {
            return res.status(400).json({ message: 'Invalid payload: grade_id and allocations array required' });
        }
        if (allocations.length === 0) {
            return res.json({ message: 'No allocations provided, nothing changed' });
        }
        // Wrap in robust transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            let updatedCount = 0;
            // We process sequentially inside the transaction to cleanly catch logical mismatch validation errors
            for (const al of allocations) {
                if (!al.student_id || !al.section_id)
                    throw new Error('Missing student_id or section_id in allocation block');
                // Ensure student exists and belongs to this exact grade
                const student = await tx.user.findFirst({
                    where: { id: al.student_id, organization_id: req.user.organization_id }
                });
                if (!student)
                    throw new Error(`Student ${al.student_id} not found`);
                if (student.grade_id !== grade_id)
                    throw new Error(`Invalid section assignment for selected grade: Student ${student.name} does not belong to grade ${grade_id}`);
                // Ensure section exists and belongs to the specified grade
                const section = await tx.section.findFirst({
                    where: { id: al.section_id, organization_id: req.user.organization_id }
                });
                if (!section)
                    throw new Error(`Section ${al.section_id} not found`);
                if (section.grade_id !== grade_id)
                    throw new Error(`Invalid section assignment for selected grade: Section ${section.name} does not belong to grade ${grade_id}`);
                // Perform the clean assign update
                await tx.user.update({
                    where: { id: student.id },
                    data: { section_id: section.id }
                });
                updatedCount++;
            }
            return updatedCount;
        });
        res.json({ message: 'Section allocations saved successfully', updatedCount: result });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Error executing bulk allocation.' });
    }
});
// Override delete for sections to unlink users first
router.delete('/sections/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const existing = await prisma_1.default.section.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        await prisma_1.default.$transaction(async (tx) => {
            // Unlink users attached to this section (they keep their grade, lose the section)
            await tx.user.updateMany({
                where: { section_id: req.params.id, organization_id: req.user.organization_id },
                data: { section_id: null }
            });
            await tx.section.delete({ where: { id: req.params.id } });
        });
        res.json({ message: 'Section deleted' });
    }
    catch (error) {
        console.error(`Error deleting Section:`, error);
        res.status(400).json({ message: 'Error deleting Section', error: error.message });
    }
});
router.use('/sections', createCrudHandlers('Section', prisma_1.default.section));
// ── Subjects: custom handler — auto-resolves grade_id if a section_id is sent ──────────────────
const subjectRouter = (0, express_1.Router)();
subjectRouter.get('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const filter = { organization_id: req.user.organization_id };
        if (req.query.grade_id) {
            filter.grade_id = String(req.query.grade_id);
        }
        const isGlobalAdmin = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(req.user.role);
        if (!isGlobalAdmin) {
            const assignments = await prisma_1.default.teacherAssignment.findMany({
                where: { teacher_id: req.user.user_id, organization_id: req.user.organization_id }
            });
            const inchargeGradeIds = assignments
                .filter((a) => a.assignment_type === 'CLASS_INCHARGE')
                .map((a) => a.grade_id);
            const specificSubjectIds = assignments
                .filter((a) => a.subject_id)
                .map((a) => a.subject_id);
            filter.OR = [
                { grade_id: { in: inchargeGradeIds } },
                { id: { in: specificSubjectIds } }
            ];
        }
        const data = await prisma_1.default.subject.findMany({
            where: filter,
            include: {
                subject_groups: {
                    include: {
                        group: {
                            select: { section_id: true }
                        }
                    }
                }
            },
            orderBy: { sort_order: 'asc' }
        });
        const mappedData = data.map((sub) => {
            const { subject_groups, ...rest } = sub;
            const section_ids = subject_groups
                .filter((sg) => sg.group && sg.group.section_id)
                .map((sg) => sg.group.section_id);
            return { ...rest, section_ids: Array.from(new Set(section_ids)) };
        });
        res.json(mappedData);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching Subjects' });
    }
});
subjectRouter.post('/', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const { name, grade_id: req_grade_id } = req.body;
        if (!name || !req_grade_id) {
            return res.status(400).json({ message: 'Subject name and grade_id are required' });
        }
        let finalGradeId = req_grade_id;
        // Auto-fix: if the UI sent a section_id as grade_id, resolve the real grade_id
        const possibleSection = await prisma_1.default.section.findUnique({ where: { id: req_grade_id } });
        if (possibleSection) {
            finalGradeId = possibleSection.grade_id;
        }
        // Fetch grade name (needed for SubjectGroup naming convention)
        const gradeRecord = await prisma_1.default.grade.findUnique({ where: { id: finalGradeId }, select: { name: true } });
        const data = await prisma_1.default.subject.upsert({
            where: {
                name_grade_id_organization_id: {
                    name,
                    grade_id: finalGradeId,
                    organization_id: req.user.organization_id
                }
            },
            update: {},
            create: { name, grade_id: finalGradeId, organization_id: req.user.organization_id }
        });
        // If section_id is explicitly provided → link ONLY to that section.
        // Otherwise → link to ALL sections under the grade (global subject).
        const requestedSectionId = req.body.section_id;
        const allSections = await prisma_1.default.section.findMany({
            where: { grade_id: finalGradeId, organization_id: req.user.organization_id },
            select: { id: true, name: true }
        });
        const targetSections = requestedSectionId
            ? allSections.filter((s) => s.id === requestedSectionId)
            : allSections;
        for (const sec of targetSections) {
            const groupName = `${gradeRecord?.name || finalGradeId} - ${sec.name} (Default)`;
            const defaultGroup = await prisma_1.default.subjectGroup.upsert({
                where: {
                    name_grade_id_section_id_organization_id: {
                        name: groupName,
                        grade_id: finalGradeId,
                        section_id: sec.id,
                        organization_id: req.user.organization_id
                    }
                },
                update: {},
                create: {
                    name: groupName,
                    grade_id: finalGradeId,
                    section_id: sec.id,
                    organization_id: req.user.organization_id
                }
            });
            await prisma_1.default.subjectGroupSubject.upsert({
                where: { group_id_subject_id: { group_id: defaultGroup.id, subject_id: data.id } },
                update: {},
                create: { group_id: defaultGroup.id, subject_id: data.id, subject_type: 'MANDATORY' }
            });
        }
        res.status(201).json({ message: 'Subject created', data });
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating Subject', error: error.message });
    }
});
subjectRouter.put('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const existing = await prisma_1.default.subject.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        const data = await prisma_1.default.subject.update({ where: { id: req.params.id }, data: { name: req.body.name } });
        res.json({ message: 'Subject updated', data });
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating Subject', error: error.message });
    }
});
subjectRouter.delete('/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const existing = await prisma_1.default.subject.findFirst({ where: { id: req.params.id, organization_id: req.user.organization_id } });
        if (!existing)
            return res.status(404).json({ message: 'Not found' });
        await prisma_1.default.subject.delete({ where: { id: req.params.id } });
        res.json({ message: 'Subject deleted' });
    }
    catch (error) {
        res.status(400).json({ message: 'Error deleting Subject', error: error.message });
    }
});
// DELETE subject from ONE section only — removes SubjectGroupSubject links for groups in that section
// The subject itself (global entity) is NOT deleted
subjectRouter.delete('/:id/section/:section_id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const { id: subjectId, section_id: sectionId } = req.params;
        const org_id = req.user.organization_id;
        // Find all SubjectGroups belonging to this section
        const groups = await prisma_1.default.subjectGroup.findMany({
            where: { section_id: sectionId, organization_id: org_id },
            select: { id: true }
        });
        const groupIds = groups.map((g) => g.id);
        if (groupIds.length === 0) {
            return res.json({ message: 'Subject already not linked to any group in this section', removed: 0 });
        }
        // Remove SubjectGroupSubject links for this subject in those groups
        const result = await prisma_1.default.subjectGroupSubject.deleteMany({
            where: { subject_id: subjectId, group_id: { in: groupIds } }
        });
        res.json({ message: `Subject unlinked from section`, removed: result.count });
    }
    catch (error) {
        res.status(400).json({ message: 'Error unlinking subject from section', error: error.message });
    }
});
router.use('/subjects', subjectRouter);
router.use('/syllabuses', createCrudHandlers('Syllabus', prisma_1.default.syllabus));
// ── BULK ACADEMIC STRUCTURE SETUP ────────────────────────────────────────────
// POST /api/academic/bulk-setup
// Creates grades → sections → subjects → units → topics in one transaction.
// Existing records are skipped (idempotent). Safe to run multiple times.
router.post('/bulk-setup', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        // ── Validate input ─────────────────────────────────────────────────────
        const { grades, sections = [], section_mapping = [], subjects = [] } = req.body;
        if (!Array.isArray(grades) || grades.length === 0)
            return res.status(400).json({ message: '`grades` must be a non-empty array of grade names' });
        if (!Array.isArray(subjects) || subjects.length === 0)
            return res.status(400).json({ message: '`subjects` must be a non-empty array' });
        // ── Resolve active academic year ──────────────────────────────────────
        let activeYear = await prisma_1.default.academicYear.findFirst({ where: { organization_id: org_id, is_active: true } });
        if (!activeYear) {
            const now = new Date();
            activeYear = await prisma_1.default.academicYear.create({
                data: { name: `${now.getFullYear()}-${now.getFullYear() + 1}`, organization_id: org_id, is_active: true }
            });
        }
        const academic_year_id = activeYear.id;
        // ── Helper: resolve sections for a given grade name ───────────────────
        const getSectionsForGrade = (gradeName) => {
            if (Array.isArray(section_mapping) && section_mapping.length > 0) {
                for (const group of section_mapping) {
                    if (Array.isArray(group.grade_names) && group.grade_names.includes(gradeName)) {
                        return Array.isArray(group.sections) ? group.sections : [];
                    }
                }
            }
            return Array.isArray(sections) ? sections : [];
        };
        // ── Counters ──────────────────────────────────────────────────────────
        const summary = { grades_created: 0, grades_skipped: 0, sections_created: 0, sections_skipped: 0, subjects_created: 0, subjects_skipped: 0, units_created: 0, units_skipped: 0, topics_created: 0, topics_skipped: 0 };
        const created = [];
        // ── Run inside a transaction ──────────────────────────────────────────
        await prisma_1.default.$transaction(async (tx) => {
            for (const gradeName of grades) {
                // Normalize: strip leading "Grade " so "Grade 10" and "10" map to the same DB record
                const gName = String(gradeName).trim().replace(/^grade\s*/i, '').trim();
                if (!gName)
                    continue;
                // Grade — has unique constraint: upsert is safe
                const gradeResult = await tx.grade.upsert({
                    where: { name_academic_year_id_organization_id: { name: gName, academic_year_id, organization_id: org_id } },
                    update: {},
                    create: { name: gName, academic_year_id, organization_id: org_id }
                });
                // Check if we created or skipped (upsert returns old record on update:{})
                const gradeIsNew = gradeResult.created_at &&
                    (Date.now() - new Date(gradeResult.created_at).getTime()) < 5000;
                // We track differently: check if it existed before by querying after upsert
                // Simple approach: keep running count via checking pre-existence
                const gradeEntry = { grade_name: gName, grade_id: gradeResult.id, subjects: [] };
                created.push(gradeEntry);
                // Sections — has unique constraint: upsert is safe
                const gradeSections = getSectionsForGrade(gName);
                const sectionResults = []; // store results for SubjectGroup linking below
                for (const secName of gradeSections) {
                    const sName = String(secName).trim();
                    if (!sName)
                        continue;
                    const sectionResult = await tx.section.upsert({
                        where: { name_grade_id_organization_id: { name: sName, grade_id: gradeResult.id, organization_id: org_id } },
                        update: {},
                        create: { name: sName, grade_id: gradeResult.id, organization_id: org_id }
                    });
                    sectionResults.push(sectionResult);
                }
                // Subjects → Units → Topics
                for (const sub of subjects) {
                    const subName = String(sub.name || '').trim();
                    if (!subName)
                        continue;
                    // Subject — has unique constraint: upsert is safe
                    const subjectResult = await tx.subject.upsert({
                        where: { name_grade_id_organization_id: { name: subName, grade_id: gradeResult.id, organization_id: org_id } },
                        update: {},
                        create: { name: subName, grade_id: gradeResult.id, organization_id: org_id }
                    });
                    const subjectEntry = { name: subName, subject_id: subjectResult.id, units: [] };
                    gradeEntry.subjects.push(subjectEntry);
                    // ── Link subject to each section via SubjectGroup ───────────────────
                    // Only runs when sections were provided in this bulk setup call
                    for (const sec of sectionResults) {
                        const groupName = `${gName} - ${sec.name} (Default)`;
                        // Get or create the default group for this section
                        const defaultGroup = await tx.subjectGroup.upsert({
                            where: {
                                name_grade_id_section_id_organization_id: {
                                    name: groupName,
                                    grade_id: gradeResult.id,
                                    section_id: sec.id,
                                    organization_id: org_id
                                }
                            },
                            update: {},
                            create: {
                                name: groupName,
                                grade_id: gradeResult.id,
                                section_id: sec.id,
                                organization_id: org_id
                            }
                        });
                        // Link subject to group — skip if already linked
                        const existingLink = await tx.subjectGroupSubject.findFirst({
                            where: { group_id: defaultGroup.id, subject_id: subjectResult.id }
                        });
                        if (!existingLink) {
                            await tx.subjectGroupSubject.create({
                                data: { group_id: defaultGroup.id, subject_id: subjectResult.id, subject_type: 'MANDATORY' }
                            });
                        }
                    }
                    // ── End SubjectGroup linking ────────────────────────────────────────
                    for (const unit of (sub.units || [])) {
                        const uName = String(unit.name || '').trim();
                        if (!uName)
                            continue;
                        // Unit — NO unique constraint: findFirst then create
                        let unitResult = await tx.unit.findFirst({
                            where: { name: uName, subject_id: subjectResult.id, organization_id: org_id }
                        });
                        let unitIsNew = false;
                        if (!unitResult) {
                            unitResult = await tx.unit.create({
                                data: { name: uName, subject_id: subjectResult.id, organization_id: org_id }
                            });
                            unitIsNew = true;
                            summary.units_created++;
                        }
                        else {
                            summary.units_skipped++;
                        }
                        const unitEntry = { name: uName, unit_id: unitResult.id, topics: [] };
                        subjectEntry.units.push(unitEntry);
                        for (const topicName of (unit.topics || [])) {
                            const tName = String(topicName || '').trim();
                            if (!tName)
                                continue;
                            // Topic — NO unique constraint: findFirst then create
                            let topicResult = await tx.topic.findFirst({
                                where: { name: tName, unit_id: unitResult.id, organization_id: org_id }
                            });
                            if (!topicResult) {
                                topicResult = await tx.topic.create({
                                    data: { name: tName, unit_id: unitResult.id, organization_id: org_id }
                                });
                                summary.topics_created++;
                            }
                            else {
                                summary.topics_skipped++;
                            }
                            unitEntry.topics.push(tName);
                        }
                    }
                }
            }
        }, { timeout: 30000 });
        // Count grade/section/subject created vs skipped using post-transaction query
        // (upsert doesn't reliably tell us if it created or updated, so we recount)
        const summaryMsg = `Bulk setup complete. ` +
            `Grades: ${grades.length} processed. ` +
            `Units: ${summary.units_created} created, ${summary.units_skipped} skipped. ` +
            `Topics: ${summary.topics_created} created, ${summary.topics_skipped} skipped.`;
        res.status(201).json({ message: summaryMsg, summary, created });
    }
    catch (error) {
        console.error('[bulk-setup] ERROR:', error.message);
        res.status(500).json({ message: 'Bulk setup failed', error: error.message });
    }
});
// ── DIAGNOSTIC: shows exactly what units are linked to which subjects ─────────
// GET /api/academic/diagnostic  — remove once the bulk import issue is resolved
router.get('/diagnostic', async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const [grades, subjects, syllabuses, units, topics] = await Promise.all([
            prisma_1.default.grade.findMany({ where: { organization_id: org_id }, select: { id: true, name: true } }),
            prisma_1.default.subject.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, grade_id: true } }),
            prisma_1.default.syllabus.findMany({ where: { organization_id: org_id }, select: { id: true, subject_id: true } }),
            prisma_1.default.unit.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, subject_id: true, syllabus_id: true } }),
            prisma_1.default.topic.findMany({ where: { organization_id: org_id }, select: { id: true, name: true, unit_id: true } }),
        ]);
        const syllabusMap = new Map(syllabuses.map((s) => [s.id, s.subject_id]));
        const enrichedUnits = units.map((u) => ({
            id: u.id,
            name: u.name,
            subject_id: u.subject_id,
            syllabus_id: u.syllabus_id,
            resolvedSubjectId: u.subject_id ?? (u.syllabus_id ? syllabusMap.get(u.syllabus_id) ?? null : null),
            resolvedSubjectName: (() => {
                const sid = u.subject_id ?? (u.syllabus_id ? syllabusMap.get(u.syllabus_id) : null);
                return subjects.find((s) => s.id === sid)?.name ?? '⚠️ UNRESOLVED';
            })()
        }));
        res.json({
            grades,
            subjects: subjects.map((s) => ({
                ...s,
                gradeName: grades.find((g) => g.id === s.grade_id)?.name ?? '?'
            })),
            units: enrichedUnits,
            topics
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.use('/units', createCrudHandlers('Unit', prisma_1.default.unit));
router.use('/topics', createCrudHandlers('Topic', prisma_1.default.topic));
// --- Stream-Based Academic Structure Support ---
// 1. Subject Groups (Streams)
router.get('/subject-groups', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const filter = { organization_id: org_id };
        if (req.query.grade_id)
            filter.grade_id = String(req.query.grade_id);
        if (req.query.section_id)
            filter.section_id = String(req.query.section_id);
        const groups = await prisma_1.default.subjectGroup.findMany({
            where: filter,
            include: {
                subjects: {
                    include: { subject: true }
                }
            }
        });
        // Exclude internal default/placeholder groups when requested 
        // (used by student-mapping UI to prevent assigning students to technical groups)
        const excludeDefault = req.query.exclude_default === 'true';
        const filtered = excludeDefault
            ? groups.filter((g) => {
                const lower = g.name.toLowerCase().trim();
                return !lower.endsWith('(default)') && lower !== 'default curriculum';
            })
            : groups;
        // Map response for frontend consumption
        const mapped = filtered.map((g) => ({
            id: g.id,
            name: g.name,
            grade_id: g.grade_id,
            section_id: g.section_id,
            subjects: g.subjects.map((sg) => ({
                id: sg.subject.id,
                name: sg.subject.name,
                subject_type: sg.subject_type
            }))
        }));
        res.json(mapped);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/subject-groups', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { name, grade_id, section_id, subjects } = req.body;
        if (!name || !grade_id || !section_id) {
            return res.status(400).json({ message: 'Missing required fields: name, grade_id, section_id' });
        }
        const result = await prisma_1.default.$transaction(async (tx) => {
            // Create the group
            const group = await tx.subjectGroup.create({
                data: {
                    organization_id: org_id,
                    name,
                    grade_id,
                    section_id
                }
            });
            // Link subjects
            if (Array.isArray(subjects) && subjects.length > 0) {
                const payload = subjects.map((s) => ({
                    group_id: group.id,
                    subject_id: s.subject_id,
                    subject_type: s.subject_type || 'MANDATORY'
                }));
                await tx.subjectGroupSubject.createMany({
                    data: payload
                });
            }
            return group;
        });
        res.status(201).json(result);
    }
    catch (err) {
        if (err.code === 'P2002')
            return res.status(400).json({ message: 'A Subject Group with this exact name already exists in this Section' });
        res.status(500).json({ error: err.message });
    }
});
router.put('/subject-groups/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'EDIT'), async (req, res) => {
    try {
        const { id } = req.params;
        const org_id = req.user.organization_id;
        const { name, subjects } = req.body;
        const group = await prisma_1.default.subjectGroup.findFirst({ where: { id, organization_id: org_id } });
        if (!group)
            return res.status(404).json({ message: 'Subject Group not found' });
        await prisma_1.default.$transaction(async (tx) => {
            if (name) {
                await tx.subjectGroup.update({ where: { id }, data: { name } });
            }
            if (Array.isArray(subjects)) {
                // Clear old ones
                await tx.subjectGroupSubject.deleteMany({ where: { group_id: id } });
                // Insert new ones
                if (subjects.length > 0) {
                    const payload = subjects.map((s) => ({
                        group_id: id,
                        subject_id: s.subject_id,
                        subject_type: s.subject_type || 'MANDATORY'
                    }));
                    await tx.subjectGroupSubject.createMany({ data: payload });
                }
            }
        });
        res.json({ message: 'Updated successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/subject-groups/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const { id } = req.params;
        const org_id = req.user.organization_id;
        const group = await prisma_1.default.subjectGroup.findFirst({ where: { id, organization_id: org_id } });
        if (!group)
            return res.status(404).json({ message: 'Subject Group not found' });
        await prisma_1.default.subjectGroup.delete({ where: { id } });
        res.json({ message: 'Deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 2. Student Group Mapping (Assigning students to stream)
router.get('/student-group-mappings', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'READ'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { grade_id, section_id } = req.query;
        let filter = { organization_id: org_id };
        // Filter mappings by nested relations
        if (grade_id || section_id) {
            filter.group = {};
            if (grade_id)
                filter.group.grade_id = String(grade_id);
            if (section_id)
                filter.group.section_id = String(section_id);
        }
        const mappings = await prisma_1.default.studentGroupMapping.findMany({
            where: filter,
            include: {
                group: true,
                student: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.json(mappings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/student-group-mapping', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { student_id, group_id } = req.body;
        if (!student_id || !group_id) {
            return res.status(400).json({ message: 'Missing student_id or group_id' });
        }
        // Validation: Enforce one group per section per student
        const targetGroup = await prisma_1.default.subjectGroup.findUnique({ where: { id: group_id } });
        if (!targetGroup)
            return res.status(404).json({ message: 'Subject Group not found' });
        const existingMappings = await prisma_1.default.studentGroupMapping.findMany({
            where: {
                student_id,
                organization_id: org_id,
                group: {
                    section_id: targetGroup.section_id
                }
            }
        });
        if (existingMappings.length > 0) {
            // Remove old mapping in the same section before creating new
            await prisma_1.default.studentGroupMapping.deleteMany({
                where: {
                    student_id,
                    group: { section_id: targetGroup.section_id }
                }
            });
        }
        const newMapping = await prisma_1.default.studentGroupMapping.create({
            data: {
                organization_id: org_id,
                student_id,
                group_id
            }
        });
        res.status(201).json(newMapping);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/student-group-mapping/:id', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const { id } = req.params;
        const org_id = req.user.organization_id;
        const mapping = await prisma_1.default.studentGroupMapping.findFirst({ where: { id, organization_id: org_id } });
        if (!mapping)
            return res.status(404).json({ message: 'Mapping not found' });
        await prisma_1.default.studentGroupMapping.delete({ where: { id } });
        res.json({ message: 'Mapping removed' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 3. Bulk mapping endpoint — map multiple students to a stream in one request
router.post('/student-group-mapping/bulk', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'CREATE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { student_ids, group_id } = req.body;
        if (!Array.isArray(student_ids) || student_ids.length === 0 || !group_id) {
            return res.status(400).json({ message: 'student_ids (non-empty array) and group_id are required' });
        }
        const targetGroup = await prisma_1.default.subjectGroup.findFirst({
            where: { id: group_id, organization_id: org_id }
        });
        if (!targetGroup)
            return res.status(404).json({ message: 'Subject Group not found' });
        const result = await prisma_1.default.$transaction(async (tx) => {
            let mapped = 0;
            let skipped = 0;
            for (const student_id of student_ids) {
                try {
                    // Verify student exists in this org
                    const student = await tx.user.findFirst({
                        where: { id: student_id, organization_id: org_id }
                    });
                    if (!student) {
                        skipped++;
                        continue;
                    }
                    // Remove any existing mapping in the same section for this student
                    await tx.studentGroupMapping.deleteMany({
                        where: {
                            student_id,
                            organization_id: org_id,
                            group: { section_id: targetGroup.section_id }
                        }
                    });
                    // Create new mapping
                    await tx.studentGroupMapping.create({
                        data: {
                            organization_id: org_id,
                            student_id,
                            group_id
                        }
                    });
                    mapped++;
                }
                catch {
                    skipped++;
                }
            }
            return { mapped, skipped };
        }, { timeout: 30000 });
        res.status(201).json({ message: `Bulk mapping complete: ${result.mapped} mapped, ${result.skipped} skipped`, ...result });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 4. Bulk unmapping endpoint — remove multiple mappings in one request
router.post('/student-group-mapping/bulk-delete', (0, auth_middleware_1.requirePermission)('ACADEMIC_STRUCTURE', 'DELETE'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const { mapping_ids } = req.body;
        if (!Array.isArray(mapping_ids) || mapping_ids.length === 0) {
            return res.status(400).json({ message: 'mapping_ids (non-empty array) is required' });
        }
        const result = await prisma_1.default.studentGroupMapping.deleteMany({
            where: {
                id: { in: mapping_ids },
                organization_id: org_id
            }
        });
        res.json({ message: `${result.count} mapping(s) removed`, removed: result.count });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
