import { BulkImportProcessor } from './bulk-import.types';

import { StudentMappingProcessor } from './processors/student-mapping.processor';
import { StudentEnrollmentProcessor } from './processors/student-enrollment.processor';
import { TeacherAssignmentProcessor } from './processors/teacher-assignment.processor';
import { SubjectGroupProcessor } from './processors/subject-group.processor';
import { QuestionBankProcessor } from './processors/question-bank.processor';
import { GradeProcessor, SectionProcessor, SubjectProcessor, UnitProcessor, TopicProcessor } from './processors/academic-structure.processors';
import { AcademicUnifiedProcessor } from './processors/academic-unified.processor';
import { UserProcessor } from './processors/user.processor';

// Map of registered processors. 
// A factory function is provided so that each request can instantiate a fresh processor bound to the user's organization context.
export const processorRegistry: Record<string, (organizationId: string, userId: string, academicYearId: string) => BulkImportProcessor> = {
  'STUDENT_ENROLLMENT': (orgId, userId, yearId) => new StudentEnrollmentProcessor(orgId, userId, yearId),
  'STUDENT_MAPPING': (orgId, userId, yearId) => new StudentMappingProcessor(orgId, userId, yearId),
  'TEACHER_ASSIGNMENT': (orgId, userId, yearId) => new TeacherAssignmentProcessor(orgId, userId, yearId),
  'SUBJECT_GROUPS': (orgId, userId, yearId) => new SubjectGroupProcessor(orgId, userId, yearId),
  'QUESTION_BANK': (orgId, userId, yearId) => new QuestionBankProcessor(orgId, userId, yearId),
  'GRADES': (orgId, userId, yearId) => new GradeProcessor(orgId, userId, yearId),
  'SECTIONS': (orgId, userId, yearId) => new SectionProcessor(orgId, userId, yearId),
  'SUBJECTS': (orgId, userId, yearId) => new SubjectProcessor(orgId, userId, yearId),
  'UNITS': (orgId, userId, yearId) => new UnitProcessor(orgId, userId, yearId),
  'TOPICS': (orgId, userId, yearId) => new TopicProcessor(orgId, userId, yearId),
  'ACADEMIC_STRUCTURE_FULL': (orgId, userId, yearId) => new AcademicUnifiedProcessor(orgId, userId, yearId),
  'USERS': (orgId, userId, yearId) => new UserProcessor(orgId, userId, yearId),
};

export const getBulkProcessor = (entityType: string, organizationId: string, userId: string, academicYearId: string): BulkImportProcessor | null => {
  const factory = processorRegistry[entityType.toUpperCase()];
  if (!factory) {
    return null;
  }
  return factory(organizationId, userId, academicYearId);
};
