"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentEnrollmentService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
const notification_service_1 = require("./notification.service");
class StudentEnrollmentService {
    // Helper to check if section has groups
    static async sectionHasGroups(organizationId, gradeId, sectionId) {
        const groupCount = await prisma_1.default.subjectGroup.count({
            where: {
                organization_id: organizationId,
                grade_id: gradeId,
                section_id: sectionId
            }
        });
        return groupCount > 0;
    }
    // Helper to validate the group assignment
    static async validateGroupAssignment(organizationId, gradeId, sectionId, subjectGroupId) {
        if (!sectionId) {
            if (subjectGroupId) {
                return { allowed: false, message: 'subject_group_id cannot be provided without a section' };
            }
            return { allowed: true };
        }
        const hasGroups = await this.sectionHasGroups(organizationId, gradeId, sectionId);
        if (hasGroups && !subjectGroupId) {
            return { allowed: false, message: 'subject_group_id is required for grouped sections' };
        }
        if (subjectGroupId) {
            const group = await prisma_1.default.subjectGroup.findUnique({
                where: { id: subjectGroupId }
            });
            if (!group || group.organization_id !== organizationId) {
                return { allowed: false, message: 'Invalid subject_group_id: does not exist or belongs to another organization' };
            }
            if (group.section_id !== sectionId) {
                return { allowed: false, message: 'Invalid subject_group_id: belongs to another section' };
            }
        }
        return { allowed: true };
    }
    /**
     * Enroll a single student (Manual Enrollment).
     */
    static async enrollStudent(orgId, academicYearId, payload) {
        const { student_id, grade_id, section_id, subject_group_id, status } = payload;
        if (!student_id || !grade_id) {
            throw new Error('student_id and grade_id required');
        }
        // 1. Group requirement validation
        const groupValidation = await this.validateGroupAssignment(orgId, grade_id, section_id, subject_group_id);
        if (!groupValidation.allowed) {
            throw new Error(groupValidation.message);
        }
        // 2. Capacity check
        if (section_id) {
            // Find existing enrollment to see if section is changing
            const existing = await prisma_1.default.studentEnrollment.findUnique({
                where: { student_id_academic_year_id_organization_id: { student_id, academic_year_id: academicYearId, organization_id: orgId } }
            });
            // If new to section, check capacity
            if (!existing || existing.section_id !== section_id) {
                const section = await prisma_1.default.section.findUnique({ where: { id: section_id } });
                if (section && section.capacity) {
                    const currentCount = await prisma_1.default.studentEnrollment.count({
                        where: { section_id, organization_id: orgId, status: client_1.EnrollmentStatus.ACTIVE }
                    });
                    if (currentCount + 1 > section.capacity) {
                        throw new Error(`Section capacity exceeded. Max: ${section.capacity}, Current: ${currentCount}, Adding: 1`);
                    }
                }
            }
        }
        // 3. Upsert
        const enrollment = await prisma_1.default.studentEnrollment.upsert({
            where: {
                student_id_academic_year_id_organization_id: {
                    student_id, academic_year_id: academicYearId, organization_id: orgId
                }
            },
            update: { grade_id, section_id: section_id || null, subject_group_id: subject_group_id || null, status: status || client_1.EnrollmentStatus.ACTIVE },
            create: {
                organization_id: orgId,
                student_id, academic_year_id: academicYearId, grade_id, section_id: section_id || null, subject_group_id: subject_group_id || null, status: status || client_1.EnrollmentStatus.ACTIVE
            }
        });
        // 4. Update User cache
        await prisma_1.default.user.updateMany({
            where: { id: student_id, organization_id: orgId },
            data: { grade_id, section_id: section_id || null }
        });
        await notification_service_1.NotificationService.sendNotification({
            organization_id: orgId,
            event_type: 'STUDENT_ENROLLMENT',
            entity_type: 'STUDENT_ENROLLMENT',
            entity_id: enrollment.id,
            title: 'Enrollment Updated',
            message: `Your enrollment has been updated for the academic year.`,
            context_data: { icon: 'user-plus', color: 'notification-green' },
            recipient_ids: [student_id]
        });
        return enrollment;
    }
    /**
     * Bulk enroll students with proper delta capacity validation.
     */
    static async bulkEnrollStudents(orgId, academicYearId, payloads) {
        if (!payloads.length)
            return { success: 0, failure: 0 };
        // 1. Group Validation & Deduplication (intra-batch)
        const validPayloads = [];
        let failureCount = 0;
        // For intra-batch deduplication (latest payload per student wins)
        const uniqueStudentMap = new Map();
        for (const p of payloads) {
            if (!p.student_id || !p.grade_id) {
                console.warn(`[Bulk Enroll] Missing student_id or grade_id`);
                failureCount++;
                continue;
            }
            try {
                const groupValidation = await this.validateGroupAssignment(orgId, p.grade_id, p.section_id, p.subject_group_id);
                if (!groupValidation.allowed) {
                    console.warn(`[Bulk Enroll] Group validation failed for ${p.student_id}: ${groupValidation.message}`);
                    failureCount++;
                    continue;
                }
                uniqueStudentMap.set(p.student_id, p);
            }
            catch (e) {
                console.error(`[Bulk Enroll] Validation error for ${p.student_id}`, e);
                failureCount++;
            }
        }
        const studentsToProcess = Array.from(uniqueStudentMap.values());
        if (!studentsToProcess.length)
            return { success: 0, failure: failureCount };
        // 2. Capacity Validation Strategy (Delta-based)
        // Group incoming students by section
        const sectionIncomingMap = new Map(); // sectionId -> Set of studentIds
        for (const p of studentsToProcess) {
            if (p.section_id) {
                if (!sectionIncomingMap.has(p.section_id))
                    sectionIncomingMap.set(p.section_id, new Set());
                sectionIncomingMap.get(p.section_id).add(p.student_id);
            }
        }
        // Check capacity for each section
        for (const [sectionId, studentIds] of sectionIncomingMap.entries()) {
            const section = await prisma_1.default.section.findUnique({ where: { id: sectionId } });
            if (!section || !section.capacity)
                continue;
            const currentCount = await prisma_1.default.studentEnrollment.count({
                where: { section_id: sectionId, organization_id: orgId, status: client_1.EnrollmentStatus.ACTIVE }
            });
            // Find how many of the incoming students are ALREADY in this section
            const alreadyInSection = await prisma_1.default.studentEnrollment.count({
                where: {
                    student_id: { in: Array.from(studentIds) },
                    academic_year_id: academicYearId,
                    organization_id: orgId,
                    section_id: sectionId,
                    status: client_1.EnrollmentStatus.ACTIVE
                }
            });
            const trueAddedCount = studentIds.size - alreadyInSection;
            if (currentCount + trueAddedCount > section.capacity) {
                throw new Error(`Cannot enroll: Section '${section.name}' capacity exceeded. Max: ${section.capacity}, Current: ${currentCount}, Adding: ${trueAddedCount}`);
            }
        }
        // 3. Commit Phase
        let successCount = 0;
        await prisma_1.default.$transaction(async (tx) => {
            for (const p of studentsToProcess) {
                await tx.studentEnrollment.upsert({
                    where: { student_id_academic_year_id_organization_id: { student_id: p.student_id, academic_year_id: academicYearId, organization_id: orgId } },
                    update: { grade_id: p.grade_id, section_id: p.section_id || null, subject_group_id: p.subject_group_id || null, status: p.status || client_1.EnrollmentStatus.ACTIVE },
                    create: { organization_id: orgId, student_id: p.student_id, academic_year_id: academicYearId, grade_id: p.grade_id, section_id: p.section_id || null, subject_group_id: p.subject_group_id || null, status: p.status || client_1.EnrollmentStatus.ACTIVE }
                });
                await tx.user.updateMany({
                    where: { id: p.student_id, organization_id: orgId },
                    data: { grade_id: p.grade_id, section_id: p.section_id || null }
                });
                successCount++;
            }
        }, {
            timeout: 15000 // Increase timeout for larger batches
        });
        // 4. Send Notifications Outside Transaction
        const notificationPromises = studentsToProcess.map(p => notification_service_1.NotificationService.sendNotification({
            organization_id: orgId,
            event_type: 'STUDENT_ENROLLMENT',
            entity_type: 'STUDENT_ENROLLMENT',
            entity_id: p.student_id,
            title: 'Enrollment Updated',
            message: `Your enrollment has been updated for the academic year.`,
            context_data: { icon: 'user-plus', color: 'notification-green' },
            recipient_ids: [p.student_id]
        }).catch(err => console.error(`[Bulk Enroll] Failed to send notification to ${p.student_id}`, err)));
        // Don't wait for all notifications to finish to avoid blocking response for too long, 
        // or we can await them if needed. Awaiting with Promise.all is safe here since we catch errors.
        await Promise.all(notificationPromises);
        return { success: successCount, failure: failureCount };
    }
}
exports.StudentEnrollmentService = StudentEnrollmentService;
