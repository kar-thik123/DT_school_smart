export interface StudentOverview {
  name: string;
  roll_number?: string;
  profile_picture?: string;
  grade: string;
  section?: string;
  group?: string;
  academic_year: string;
  academic_year_id?: string;
  last_enrollment?: {
    grade?: string;
    academic_year?: string;
  };
  favorite_subjects?: string[];
  favorite_colour?: string;
}

export interface StudentKPIs {
  readyForExam: number;
  subjects: number;
  weakSubject: string;
  curriculumCoverage: number;
  attendance: number;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  unitCompleted: number;
  unitTotal: number;
  topicCompleted: number;
  topicTotal: number;
  subtopicCompleted: number;
  subtopicTotal: number;
  coverage: number;
  accuracy: number;
  readiness: number;
  totalAssessmentSets: number;
  attemptedSets: number;
  completedSets: number;
  masteredSets: number;
  nextNode?: { type: string, id: string };
}

export interface WeeklyTrend {
  week: string | Date;
  coverage: number;
  accuracy: number;
  readiness: number;
}

export interface AttendanceSummary {
  attendancePercentage: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface ContinueLearning {
  subject: string;
  subjectId?: string;
  title: string;
  reason: string;
  priority: string;
  readinessImpact: number;
  actionUrl: string;
}

export interface CurriculumProgress {
  subject_id: string;
  subject_name: string;
  units_total: number;
  units_completed: number;
  topics_total: number;
  topics_completed: number;
  completion_percentage: number;
}

export interface TeacherAssignment {
  teacher_id: string;
  teacher_name: string;
  official_email: string;
  profile_picture?: string;
  assigned_subjects: string[];
}

export interface TimelineActivity {
  id: string;
  type: 'practice' | 'completion' | 'skill' | 'notification';
  date: string | Date;
  title: string;
  description: string;
  reference_id?: string;
}

export interface StudentSkill {
  id: string;
  skill_type: string;
  skill_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  verified_by?: string;
  remarks?: string;
}

export interface ExaminationSummary {
  examName: string;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  percentage: number;
}

export interface ExaminationHistory {
  examName: string;
  percentage: number;
  date: string | Date;
}

export interface ExaminationSubject {
  subjectName: string;
  obtainedMarks: number;
  maxMarks: number;
  percentage: number;
}

export interface ExaminationAnalyticsResponse {
  summary: ExaminationSummary | null;
  history: ExaminationHistory[];
  subjects: ExaminationSubject[];
}
