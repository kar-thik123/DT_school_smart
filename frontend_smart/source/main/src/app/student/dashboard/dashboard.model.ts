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
}

export interface StudentKPIs {
  practice_accuracy: number;
  questions_attempted: number;
  skills_completion: number;
}

export interface SubjectPerformance {
  subject_id: string;
  subject_name: string;
  practice_accuracy: number;
  questions_attempted: number;
  completed_topics: number;
  pending_topics: number;
}

export interface WeeklyTrend {
  week_start: string | Date;
  total_questions: number;
  overall_accuracy: number;
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
