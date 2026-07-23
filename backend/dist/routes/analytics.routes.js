"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const academic_context_resolver_1 = require("../utils/academic-context.resolver");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// --- MANAGEMENT TOPIC ANALYTICS ---
// View performance and Validation Engine labels
// OPTIMIZED: Bulk-loads attempts and student counts to eliminate N+1 queries
router.get('/topic', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        const { grade_id, section_id, subject_id } = req.query;
        // TopicActivation → subjectGroup → section (no direct section relation on the model)
        const filter = { organization_id: org_id, academic_year_id: yearId };
        if (section_id)
            filter.subjectGroup = { section_id: String(section_id) };
        else if (grade_id)
            filter.subjectGroup = { section: { grade_id: String(grade_id) } };
        const topicActivations = await prisma_1.default.topicActivation.findMany({
            where: filter,
            include: {
                topic: {
                    select: {
                        id: true,
                        name: true,
                        unit: { select: { subject_id: true } }
                    }
                },
                subjectGroup: {
                    select: {
                        section_id: true,
                        section: { select: { id: true, name: true, grade_id: true } }
                    }
                }
            }
        });
        // Filter activations by subject_id early
        const filteredActivations = subject_id
            ? topicActivations.filter((a) => a.topic.unit.subject_id === subject_id)
            : topicActivations;
        // Collect unique topic IDs and section IDs for bulk queries
        const topicIds = [...new Set(filteredActivations.map((a) => a.topic_id))];
        const sectionIds = [...new Set(filteredActivations.map((a) => a.subjectGroup?.section_id).filter(Boolean))];
        // BULK LOAD: All practice attempts for relevant topics in one query
        const allAttempts = topicIds.length > 0 ? await prisma_1.default.practiceAttempt.findMany({
            where: {
                organization_id: org_id,
                academic_year_id: yearId,
                topic_id: { in: topicIds }
            },
            include: {
                student: { select: { section_id: true } }
            }
        }) : [];
        // Group attempts by composite key: topic_id + section_id
        const attemptsByKey = new Map();
        for (const attempt of allAttempts) {
            const key = `${attempt.topic_id}_${attempt.student?.section_id || 'null'}`;
            if (!attemptsByKey.has(key))
                attemptsByKey.set(key, []);
            attemptsByKey.get(key).push(attempt);
        }
        // BULK LOAD: Student counts per section in one query
        const studentCountsBySection = new Map();
        if (sectionIds.length > 0) {
            const sectionCounts = await prisma_1.default.user.groupBy({
                by: ['section_id'],
                where: { organization_id: org_id, is_active: true, section_id: { in: sectionIds } },
                _count: { id: true }
            });
            for (const sc of sectionCounts) {
                if (sc.section_id)
                    studentCountsBySection.set(sc.section_id, sc._count.id);
            }
        }
        // Process results using pre-loaded data (no more DB calls in loop)
        const results = [];
        for (const activation of filteredActivations) {
            const sectionId = activation.subjectGroup?.section_id;
            const key = `${activation.topic_id}_${sectionId || 'null'}`;
            const attempts = attemptsByKey.get(key) || [];
            const totalStudents = sectionId ? (studentCountsBySection.get(sectionId) || 0) : 0;
            const uniqueStudentsAttempted = new Set(attempts.map((a) => a.student_id)).size;
            let avgAccuracy = 0;
            let passCount = 0;
            if (attempts.length > 0) {
                let totalPct = 0;
                attempts.forEach((a) => {
                    const pct = (a.correct_answers / Math.max(a.total_questions, 1)) * 100;
                    totalPct += pct;
                    if (pct >= 40)
                        passCount++;
                });
                avgAccuracy = totalPct / attempts.length;
            }
            // Teaching Validation Logic
            let teachingValidation = 'N/A';
            if (attempts.length > 0) {
                if (avgAccuracy >= 70)
                    teachingValidation = 'GOOD';
                else if (avgAccuracy >= 40)
                    teachingValidation = 'AVERAGE';
                else
                    teachingValidation = 'POOR';
            }
            // Fake Completion Detection
            if (activation.is_completed && avgAccuracy < 40 && attempts.length > 0) {
                teachingValidation = 'INVALID COMPLETION';
            }
            results.push({
                topic_activation_id: activation.id,
                topic_id: activation.topic.id,
                topic_name: activation.topic.name,
                section_name: activation.subjectGroup?.section?.name ?? 'N/A',
                is_completed: activation.is_completed,
                total_students: totalStudents,
                students_attempted: uniqueStudentsAttempted,
                average_accuracy: Math.round(avgAccuracy),
                pass_percentage: uniqueStudentsAttempted ? Math.round((passCount / attempts.length) * 100) : 0,
                teaching_validation: teachingValidation
            });
        }
        res.json(results);
    }
    catch (error) {
        console.error('Topic analytics error:', error);
        res.status(500).json({ message: 'Error fetching topic analytics' });
    }
});
// --- TEACHER CLASS/SUBJECT ANALYTICS ---
// NO validation labels allowed
router.get('/teacher', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_TEACHER'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const teacher_id = req.user.user_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        // Get assigned subjects and classes
        const assignments = await prisma_1.default.teacherAssignment.findMany({
            where: { teacher_id, organization_id: org_id, academic_year_id: yearId },
            include: {
                subject: true,
                section: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                grade: true
            }
        });
        // Simplify analytics: Just collect attempts belonging to those boundaries
        const sectionIds = assignments.map((a) => a.section_id).filter(Boolean);
        const subjectIds = assignments.map((a) => a.subject_id).filter(Boolean);
        const attempts = await prisma_1.default.practiceAttempt.findMany({
            where: {
                organization_id: org_id,
                academic_year_id: yearId,
                OR: [
                    { student: { section_id: { in: sectionIds } } },
                    { subject_id: { in: subjectIds } }
                ]
            },
            include: {
                subject: { select: { id: true, name: true } },
                student: { select: { id: true, name: true, section_id: true } }
            }
        });
        // Aggregate class/subject performance
        const subjectPerformance = {};
        attempts.forEach((a) => {
            const pct = (a.correct_answers / Math.max(a.total_questions, 1)) * 100;
            if (!subjectPerformance[a.subject_id]) {
                subjectPerformance[a.subject_id] = { totalPct: 0, count: 0, name: a.subject.name };
            }
            subjectPerformance[a.subject_id].totalPct += pct;
            subjectPerformance[a.subject_id].count++;
        });
        const parsedSubjects = Object.values(subjectPerformance).map((s) => ({
            subject_name: s.name,
            average_accuracy: Math.round(s.totalPct / s.count)
        }));
        // Explicitly omitting the teaching_validation label here per requirements.
        res.json({ subject_performance: parsedSubjects });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching teacher analytics' });
    }
});
// --- MANAGEMENT CONSOLIDATED OVERVIEW ---
// Used for the management dashboard to see general health
router.get('/management/overview', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        // Total Students based on Identity (Organization-wide)
        const totalStudents = await prisma_1.default.user.count({
            where: {
                organization_id: org_id,
                is_active: true,
                role: {
                    name: { notIn: ['System Admin', 'SYSTEM_ADMIN', 'Super Admin', 'SUPER_ADMIN', 'Management', 'MANAGEMENT', 'Admin', 'ADMIN'] },
                    permissions: {
                        some: {
                            permission: {
                                module: 'IDENTITY',
                                action: 'IS_STUDENT'
                            }
                        }
                    }
                }
            }
        });
        // Total Teachers based on Identity (Organization-wide)
        const totalTeachers = await prisma_1.default.user.count({
            where: {
                organization_id: org_id,
                is_active: true,
                role: {
                    name: { notIn: ['System Admin', 'SYSTEM_ADMIN', 'Super Admin', 'SUPER_ADMIN', 'Management', 'MANAGEMENT', 'Admin', 'ADMIN'] },
                    permissions: {
                        some: {
                            permission: {
                                module: 'IDENTITY',
                                action: 'IS_TEACHER'
                            }
                        }
                    }
                }
            }
        });
        // Active Classes (Count of active Sections belonging to Grade hierarchy for this year)
        const activeClasses = await prisma_1.default.section.count({
            where: {
                organization_id: org_id,
                is_active: true,
                grade: { academic_year_id: yearId }
            }
        });
        // Overall Attendance
        const attendanceStats = await prisma_1.default.studentAttendance.groupBy({
            by: ['status'],
            where: {
                organization_id: org_id,
                academic_year_id: yearId,
                status: { not: 'EXCUSED' }
            },
            _count: { status: true }
        });
        let totalAttendance = 0;
        let presentAttendance = 0;
        for (const stat of attendanceStats) {
            totalAttendance += stat._count.status;
            if (stat.status === 'PRESENT' || stat.status === 'LATE') {
                presentAttendance += stat._count.status;
            }
        }
        const overallAttendancePercent = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
        // Overall Pass Rate
        const examResults = await prisma_1.default.studentExamResult.groupBy({
            by: ['result_status'],
            where: { organization_id: org_id, academic_year_id: yearId },
            _count: { id: true }
        });
        let totalAppeared = 0;
        let passCount = 0;
        for (const r of examResults) {
            totalAppeared += r._count.id;
            if (r.result_status === 'PASS') {
                passCount += r._count.id;
            }
        }
        const overallPassRate = totalAppeared > 0 ? Math.round((passCount / totalAppeared) * 100) : 0;
        res.json({
            overall_pass_rate: overallPassRate,
            total_students: totalStudents,
            total_teachers: totalTeachers,
            active_classes: activeClasses,
            overall_attendance_percent: overallAttendancePercent,
            active_modules: await prisma_1.default.practiceAttempt.count({ where: { organization_id: org_id, academic_year_id: yearId } }),
            critical_alerts: 0
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching management overview' });
    }
});
// --- STUDENT SELF ANALYTICS ---
router.get('/student', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_STUDENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const student_id = req.user.user_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        const user = await prisma_1.default.user.findUnique({
            where: { id: student_id },
            select: { grade_id: true }
        });
        // Fetch subjects scoped to the student's assigned streams (not all grade subjects)
        const groupMappings = await prisma_1.default.studentGroupMapping.findMany({
            where: { student_id, organization_id: org_id, academic_year_id: yearId },
            include: {
                group: {
                    include: {
                        subjects: { include: { subject: true } }
                    }
                }
            }
        });
        // Collect unique subjects from all assigned streams
        const subjectMap = new Map();
        for (const m of groupMappings) {
            for (const gs of (m.group?.subjects || [])) {
                if (gs.subject && !subjectMap.has(gs.subject.id)) {
                    subjectMap.set(gs.subject.id, gs.subject);
                }
            }
        }
        const enrolledSubjects = Array.from(subjectMap.values());
        const attempts = await prisma_1.default.practiceAttempt.findMany({
            where: { student_id, organization_id: org_id, academic_year_id: yearId },
            include: {
                subject: { select: { id: true, name: true } },
                topic: { select: { id: true, name: true } }
            }
        });
        const subjectData = {};
        const topicData = {};
        enrolledSubjects.forEach((sub) => {
            subjectData[sub.id] = { totalPct: 0, count: 0, name: sub.name };
        });
        attempts.forEach((a) => {
            const pct = (a.correct_answers / Math.max(a.total_questions, 1)) * 100;
            // Subjects map
            if (!subjectData[a.subject_id])
                subjectData[a.subject_id] = { totalPct: 0, count: 0, name: a.subject.name };
            subjectData[a.subject_id].totalPct += pct;
            subjectData[a.subject_id].count++;
            // Topics map
            if (!topicData[a.topic_id])
                topicData[a.topic_id] = { totalPct: 0, count: 0, name: a.topic.name };
            topicData[a.topic_id].totalPct += pct;
            topicData[a.topic_id].count++;
        });
        const parsedSubjects = Object.values(subjectData).map((s) => ({
            subject_name: s.name,
            average_accuracy: s.count > 0 ? Math.round(s.totalPct / s.count) : 0
        }));
        const parsedTopics = Object.values(topicData).map((t) => ({
            topic_name: t.name,
            average_accuracy: Math.round(t.totalPct / t.count)
        }));
        const weakTopics = parsedTopics.filter((t) => t.average_accuracy < 40);
        // Calculate overall preparedness (average of subjects)
        const overallPreparedness = parsedSubjects.length > 0
            ? Math.round(parsedSubjects.reduce((acc, curr) => acc + curr.average_accuracy, 0) / parsedSubjects.length)
            : 0;
        res.json({
            preparedness: overallPreparedness,
            subject_wise_performance: parsedSubjects,
            topic_wise_performance: parsedTopics,
            weak_topics: weakTopics
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching student analytics' });
    }
});
// --- CURRICULUM COVERAGE (SPRINT 2) ---
router.get('/management/curriculum-coverage', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        const grade_id = req.query.grade_id;
        const subjectWhere = {
            organization_id: org_id,
            grade: { academic_year_id: yearId }
        };
        if (grade_id) {
            subjectWhere.grade_id = grade_id;
        }
        // 1. Fetch all subjects and their planned units in the academic year
        const subjects = await prisma_1.default.subject.findMany({
            where: subjectWhere,
            include: {
                units: {
                    select: { id: true }
                }
            }
        });
        // 2. Fetch completed units from tracking
        const trackingWhere = {
            organization_id: org_id,
            academic_year_id: yearId,
            completion_level: 'UNIT',
            is_completed: true
        };
        if (grade_id) {
            trackingWhere.grade_id = grade_id;
        }
        const subjectIds = subjects.map((s) => s.id);
        if (subjectIds.length > 0) {
            trackingWhere.subject_id = { in: subjectIds };
        }
        const completions = await prisma_1.default.completionTracking.findMany({
            where: trackingWhere,
            select: { unit_id: true }
        });
        const completedUnitIds = new Set(completions.map((c) => c.unit_id).filter(Boolean));
        let totalPlannedSchool = 0;
        let totalCompletedSchool = 0;
        const subjectBreakdown = [];
        for (const sub of subjects) {
            const plannedUnits = sub.units.length;
            let completedUnits = 0;
            for (const unit of sub.units) {
                if (completedUnitIds.has(unit.id)) {
                    completedUnits++;
                }
            }
            totalPlannedSchool += plannedUnits;
            totalCompletedSchool += completedUnits;
            const coverage = plannedUnits > 0 ? Math.round((completedUnits / plannedUnits) * 100) : 0;
            // Maintain API parameter compatibility mapping Units -> topics
            subjectBreakdown.push({
                subject: sub.name,
                planned_topics: plannedUnits,
                completed_topics: completedUnits,
                progress: coverage
            });
        }
        const overallProgress = totalPlannedSchool > 0 ? Math.round((totalCompletedSchool / totalPlannedSchool) * 100) : 0;
        res.json({
            overall_progress: overallProgress,
            subject_breakdown: subjectBreakdown
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching curriculum coverage' });
    }
});
// --- EXAMINATION SUMMARY (WIDGET 3) ---
router.get('/management/examination-summary', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        // Get the latest examination (as published status does not exist in schema)
        const latestExam = await prisma_1.default.examination.findFirst({
            where: { organization_id: org_id, academic_year_id: yearId },
            orderBy: { created_at: 'desc' }
        });
        if (!latestExam) {
            return res.json({
                average_score: 0,
                highest_score: 0,
                lowest_score: 0,
                students_appeared: 0,
                pass_percent: 0,
                fail_percent: 0
            });
        }
        const examStats = await prisma_1.default.studentExamResult.aggregate({
            where: { examination_id: latestExam.id },
            _avg: { percentage: true },
            _max: { percentage: true },
            _min: { percentage: true },
            _count: { id: true }
        });
        const studentsAppeared = examStats._count.id;
        const resultStatuses = await prisma_1.default.studentExamResult.groupBy({
            by: ['result_status'],
            where: { examination_id: latestExam.id },
            _count: { id: true }
        });
        let passCount = 0;
        let failCount = 0;
        for (const s of resultStatuses) {
            if (s.result_status === 'PASS')
                passCount += s._count.id;
            if (s.result_status === 'FAIL')
                failCount += s._count.id;
        }
        res.json({
            average_score: Math.round(examStats._avg.percentage || 0),
            highest_score: Math.round(examStats._max.percentage || 0),
            lowest_score: Math.round(examStats._min.percentage || 0),
            students_appeared: studentsAppeared,
            pass_percent: studentsAppeared > 0 ? Math.round((passCount / studentsAppeared) * 100) : 0,
            fail_percent: studentsAppeared > 0 ? Math.round((failCount / studentsAppeared) * 100) : 0
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching examination summary' });
    }
});
// --- TEACHER PERFORMANCE (WIDGET 4) ---
router.get('/management/teacher-performance', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        // Fetch active teachers with their assignments
        const teachers = await prisma_1.default.user.findMany({
            where: {
                organization_id: org_id,
                is_active: true,
                teacher_assignments: { some: { academic_year_id: yearId } }
            },
            include: {
                teacher_assignments: {
                    where: { academic_year_id: yearId },
                    include: { subject: { select: { id: true, name: true } }, section: { select: { id: true } } }
                }
            }
        });
        const subjectStats = await prisma_1.default.studentExamSubjectResult.groupBy({
            by: ['subject_id'],
            where: {
                student_exam_result: { organization_id: org_id, academic_year_id: yearId },
                is_absent: false
            },
            _sum: { obtained_marks: true, max_marks: true }
        });
        const statsMap = new Map();
        for (const stat of subjectStats) {
            if (stat._sum.max_marks && stat._sum.obtained_marks) {
                statsMap.set(stat.subject_id, stat._sum.obtained_marks / stat._sum.max_marks);
            }
        }
        const leaderboard = [];
        for (const t of teachers) {
            let totalAssignedStats = 0;
            let matchCount = 0;
            for (const assignment of t.teacher_assignments) {
                if (!assignment.subject_id)
                    continue;
                const ratio = statsMap.get(assignment.subject_id);
                if (ratio !== undefined) {
                    totalAssignedStats += ratio;
                    matchCount++;
                }
            }
            if (matchCount > 0) {
                const avgScore = Math.round((totalAssignedStats / matchCount) * 100);
                leaderboard.push({
                    teacher_id: t.id,
                    teacher_name: t.name,
                    subject: t.teacher_assignments[0]?.subject?.name || 'Multi-Subject',
                    average_score: avgScore
                });
            }
        }
        // Sort descending by score
        leaderboard.sort((a, b) => b.average_score - a.average_score);
        res.json(leaderboard);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching teacher performance' });
    }
});
// --- WEAK SUBJECTS (WIDGET 5) ---
router.get('/management/weak-subjects', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        const limit = req.query.limit;
        const subjectStats = await prisma_1.default.studentExamSubjectResult.groupBy({
            by: ['subject_id'],
            where: {
                student_exam_result: { organization_id: org_id, academic_year_id: yearId },
                is_absent: false
            },
            _sum: { obtained_marks: true, max_marks: true },
            _count: { id: true }
        });
        if (subjectStats.length === 0)
            return res.json([]);
        // Fetch subject names
        const subjects = await prisma_1.default.subject.findMany({
            where: { id: { in: subjectStats.map((s) => s.subject_id) } },
            select: { id: true, name: true }
        });
        const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
        const weakSubjects = [];
        for (const stat of subjectStats) {
            const totalObtained = stat._sum.obtained_marks || 0;
            const totalMax = stat._sum.max_marks || 0;
            if (totalMax > 0) {
                const avg = Math.round((totalObtained / totalMax) * 100);
                weakSubjects.push({
                    subject: subjectMap.get(stat.subject_id) || 'Unknown',
                    average_score: avg,
                    students_evaluated: stat._count.id,
                    latest_exam: 'Latest' // Placeholder, cannot easily get latest per group in Prisma groupBy
                });
            }
        }
        weakSubjects.sort((a, b) => a.average_score - b.average_score);
        if (limit === 'all') {
            res.json(weakSubjects);
        }
        else {
            res.json(weakSubjects.slice(0, 5));
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching weak subjects' });
    }
});
// --- STUDENT RISK (WIDGET 6) ---
router.get('/management/student-risk', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        const yearId = await academic_context_resolver_1.AcademicContextResolver.resolveHistoricalAcademicYearId(req);
        // Look for configurable threshold, default 40
        let riskThreshold = 40;
        const config = await prisma_1.default.moduleConfig.findFirst({
            where: { organization_id: org_id, module_name: 'RISK_RADAR' }
        });
        if (config && config.config_data && typeof config.config_data.threshold === 'number') {
            riskThreshold = config.config_data.threshold;
        }
        const results = await prisma_1.default.studentExamResult.findMany({
            where: {
                organization_id: org_id,
                academic_year_id: yearId,
                OR: [
                    { percentage: { lt: riskThreshold } },
                    { result_status: 'FAIL' }
                ]
            },
            include: {
                student: { select: { name: true } },
                grade_rel: { select: { name: true } },
                section: { select: { name: true } }
            },
            orderBy: { percentage: 'asc' },
            take: 10
        });
        const riskStudents = results.map((r) => {
            const avg = r.percentage || 0;
            return {
                student_id: r.student_id,
                student_name: r.student.name,
                grade_section: `${r.grade_rel.name} - ${r.section?.name || 'N/A'}`,
                average_score: Math.round(avg),
                risk_factor: avg < 30 ? 'Critical' : 'High'
            };
        });
        res.json(riskStudents);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching student risk data' });
    }
});
// --- RECENT ACTIVITY (WIDGET 7) ---
router.get('/management/recent-activity', (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_MANAGEMENT'), async (req, res) => {
    try {
        const org_id = req.user.organization_id;
        // Fetch primary from AuditLog
        const logs = await prisma_1.default.auditLog.findMany({
            where: {
                organization_id: org_id,
                action_type: {
                    notIn: ['LOGIN', 'LOGOUT', 'TOKEN_REFRESH', 'SESSION_EXPIRED', 'AUTH_FAILED', 'PASSWORD_RESET']
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 15
        });
        const activities = [];
        for (const l of logs) {
            let type = 'OTHER';
            if (['EXAMINATION', 'STUDENT_EXAM_RESULT'].includes(l.entity_type))
                type = 'EXAM_RESULT';
            else if (['SYLLABUS', 'UNIT', 'TOPIC', 'SUBTOPIC', 'COMPLETION_TRACKING'].includes(l.entity_type))
                type = 'SYLLABUS_UPDATE';
            else if (['ACADEMIC_YEAR', 'GRADE', 'SECTION'].includes(l.entity_type))
                type = 'ACADEMIC_YEAR';
            else if (['STUDENT_ENROLLMENT', 'TEACHER_ASSIGNMENT'].includes(l.entity_type))
                type = 'ADMINISTRATIVE';
            // Discard unmapped/uninteresting entities if needed, but the rule says prioritize meaningful.
            if (type === 'OTHER' && !['NOTIFICATION', 'INTERNAL_MAIL'].includes(l.entity_type)) {
                continue; // skip noisy logs
            }
            const BUSINESS_TITLES = {
                'CREATE_EXAMINATION': 'Created Examination',
                'UPDATE_SYLLABUS': 'Updated Syllabus',
                'IMPORT_STUDENT_ENROLLMENT': 'Imported Student Enrollments',
                'IMPORT_QUESTION_BANK': 'Imported Question Bank',
                'ASSIGN_TEACHER_ASSIGNMENT': 'Assigned Teacher to Class',
                'CREATE_GRADE': 'Created Grade',
                'CREATE_SECTION': 'Created Section',
                'CREATE_SUBJECT': 'Created Subject',
                'CREATE_UNIT': 'Created Unit',
                'COMPLETE_UNIT': 'Completed Unit',
                'CREATE_USER': 'Added New User',
                'CREATE_STUDENT': 'Added New Student',
                'CREATE_TEACHER': 'Added New Teacher',
                'IMPORT_ACADEMIC_STRUCTURE': 'Imported Academic Structure',
                'TOGGLE_COMPLETION': 'Updated Topic Completion',
                'PERMISSION_SYNC_ROLE_PERMISSION': 'Updated Role Permissions'
            };
            let title = '';
            const meta = l.metadata;
            // 1. Check for explicit description in metadata
            if (meta && meta.description && typeof meta.description === 'string') {
                title = meta.description;
            }
            else if (meta && meta.message && typeof meta.message === 'string') {
                title = meta.message;
            }
            else {
                // 2. Map to business friendly title
                const mapKey = `${l.action_type}_${l.entity_type}`;
                if (BUSINESS_TITLES[mapKey]) {
                    title = BUSINESS_TITLES[mapKey];
                }
                else {
                    // 3. Fallback logic
                    const actionWord = l.action_type.charAt(0) + l.action_type.slice(1).toLowerCase();
                    const entityWord = l.entity_type.toLowerCase().replace(/_/g, ' ');
                    title = `${actionWord} ${entityWord}`;
                }
            }
            activities.push({
                id: l.id,
                title,
                actor_name: l.user_name || 'System',
                timestamp: l.timestamp,
                type
            });
            if (activities.length >= 8)
                break;
        }
        res.json(activities);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching recent activities' });
    }
});
exports.default = router;
