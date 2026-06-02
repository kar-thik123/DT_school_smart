"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBulkProcessor = exports.processorRegistry = void 0;
const student_mapping_processor_1 = require("./processors/student-mapping.processor");
const student_enrollment_processor_1 = require("./processors/student-enrollment.processor");
const teacher_assignment_processor_1 = require("./processors/teacher-assignment.processor");
const subject_group_processor_1 = require("./processors/subject-group.processor");
const question_bank_processor_1 = require("./processors/question-bank.processor");
const academic_structure_processors_1 = require("./processors/academic-structure.processors");
const academic_unified_processor_1 = require("./processors/academic-unified.processor");
// Map of registered processors. 
// A factory function is provided so that each request can instantiate a fresh processor bound to the user's organization context.
exports.processorRegistry = {
    'STUDENT_ENROLLMENT': (orgId, userId, yearId) => new student_enrollment_processor_1.StudentEnrollmentProcessor(orgId, userId, yearId),
    'STUDENT_MAPPING': (orgId, userId, yearId) => new student_mapping_processor_1.StudentMappingProcessor(orgId, userId, yearId),
    'TEACHER_ASSIGNMENT': (orgId, userId, yearId) => new teacher_assignment_processor_1.TeacherAssignmentProcessor(orgId, userId, yearId),
    'SUBJECT_GROUPS': (orgId, userId, yearId) => new subject_group_processor_1.SubjectGroupProcessor(orgId, userId, yearId),
    'QUESTION_BANK': (orgId, userId, yearId) => new question_bank_processor_1.QuestionBankProcessor(orgId, userId, yearId),
    'GRADES': (orgId, userId, yearId) => new academic_structure_processors_1.GradeProcessor(orgId, userId, yearId),
    'SECTIONS': (orgId, userId, yearId) => new academic_structure_processors_1.SectionProcessor(orgId, userId, yearId),
    'SUBJECTS': (orgId, userId, yearId) => new academic_structure_processors_1.SubjectProcessor(orgId, userId, yearId),
    'UNITS': (orgId, userId, yearId) => new academic_structure_processors_1.UnitProcessor(orgId, userId, yearId),
    'TOPICS': (orgId, userId, yearId) => new academic_structure_processors_1.TopicProcessor(orgId, userId, yearId),
    'ACADEMIC_STRUCTURE_FULL': (orgId, userId, yearId) => new academic_unified_processor_1.AcademicUnifiedProcessor(orgId, userId, yearId),
};
const getBulkProcessor = (entityType, organizationId, userId, academicYearId) => {
    const factory = exports.processorRegistry[entityType];
    if (!factory) {
        return null;
    }
    return factory(organizationId, userId, academicYearId);
};
exports.getBulkProcessor = getBulkProcessor;
