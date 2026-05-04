import { BulkImportProcessor } from './bulk-import.types';

import { StudentMappingProcessor } from './processors/student-mapping.processor';
import { StudentEnrollmentProcessor } from './processors/student-enrollment.processor';
import { TeacherAssignmentProcessor } from './processors/teacher-assignment.processor';
import { SubjectGroupProcessor } from './processors/subject-group.processor';
import { QuestionBankProcessor } from './processors/question-bank.processor';
import { GradeProcessor, SectionProcessor, SubjectProcessor, UnitProcessor, TopicProcessor } from './processors/academic-structure.processors';
import { AcademicUnifiedProcessor } from './processors/academic-unified.processor';

// Map of registered processors. 
// A factory function is provided so that each request can instantiate a fresh processor bound to the user's organization context.
export const processorRegistry: Record<string, (organizationId: string, userId: string) => BulkImportProcessor> = {
  'STUDENT_ENROLLMENT': (orgId, userId) => new StudentEnrollmentProcessor(orgId, userId),
  'STUDENT_MAPPING': (orgId, userId) => new StudentMappingProcessor(orgId, userId),
  'TEACHER_ASSIGNMENT': (orgId, userId) => new TeacherAssignmentProcessor(orgId, userId),
  'SUBJECT_GROUPS': (orgId, userId) => new SubjectGroupProcessor(orgId, userId),
  'QUESTION_BANK': (orgId, userId) => new QuestionBankProcessor(orgId, userId),
  'GRADES': (orgId, userId) => new GradeProcessor(orgId, userId),
  'SECTIONS': (orgId, userId) => new SectionProcessor(orgId, userId),
  'SUBJECTS': (orgId, userId) => new SubjectProcessor(orgId, userId),
  'UNITS': (orgId, userId) => new UnitProcessor(orgId, userId),
  'TOPICS': (orgId, userId) => new TopicProcessor(orgId, userId),
  'ACADEMIC_STRUCTURE_FULL': (orgId, userId) => new AcademicUnifiedProcessor(orgId, userId),
};

export const getBulkProcessor = (entityType: string, organizationId: string, userId: string): BulkImportProcessor | null => {
  const factory = processorRegistry[entityType];
  if (!factory) {
    return null;
  }
  return factory(organizationId, userId);
};
