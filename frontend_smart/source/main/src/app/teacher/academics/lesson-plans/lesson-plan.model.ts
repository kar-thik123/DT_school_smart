export interface LessonPlan {
  id: number;
  class: string;
  subject: string;
  topic: string;
  date: string;
  status: string; // 'Planned', 'In Progress', 'Completed'
  lessonDetails: string;
}
