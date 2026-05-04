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
    'STUDENT_ENROLLMENT': (orgId, userId) => new student_enrollment_processor_1.StudentEnrollmentProcessor(orgId, userId),
    'STUDENT_MAPPING': (orgId, userId) => new student_mapping_processor_1.StudentMappingProcessor(orgId, userId),
    'TEACHER_ASSIGNMENT': (orgId, userId) => new teacher_assignment_processor_1.TeacherAssignmentProcessor(orgId, userId),
    'SUBJECT_GROUPS': (orgId, userId) => new subject_group_processor_1.SubjectGroupProcessor(orgId, userId),
    'QUESTION_BANK': (orgId, userId) => new question_bank_processor_1.QuestionBankProcessor(orgId, userId),
    'GRADES': (orgId, userId) => new academic_structure_processors_1.GradeProcessor(orgId, userId),
    'SECTIONS': (orgId, userId) => new academic_structure_processors_1.SectionProcessor(orgId, userId),
    'SUBJECTS': (orgId, userId) => new academic_structure_processors_1.SubjectProcessor(orgId, userId),
    'UNITS': (orgId, userId) => new academic_structure_processors_1.UnitProcessor(orgId, userId),
    'TOPICS': (orgId, userId) => new academic_structure_processors_1.TopicProcessor(orgId, userId),
    'ACADEMIC_STRUCTURE_FULL': (orgId, userId) => new academic_unified_processor_1.AcademicUnifiedProcessor(orgId, userId),
};
const getBulkProcessor = (entityType, organizationId, userId) => {
    const factory = exports.processorRegistry[entityType];
    if (!factory) {
        return null;
    }
    return factory(organizationId, userId);
};
exports.getBulkProcessor = getBulkProcessor;
