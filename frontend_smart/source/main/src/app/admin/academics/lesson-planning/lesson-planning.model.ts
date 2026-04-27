export class LessonPlanning {
  id: number;
  topicName: string;
  lessonName: string;
  className: string;
  subjectName: string;
  teacherName: string;
  lessonDate: string;
  status: string;
  objectives: string;
  teachingMethod: string;

  constructor(lessonPlanning: LessonPlanning) {
    {
      this.id = lessonPlanning.id || 0;
      this.topicName = lessonPlanning.topicName || '';
      this.lessonName = lessonPlanning.lessonName || '';
      this.className = lessonPlanning.className || '';
      this.subjectName = lessonPlanning.subjectName || '';
      this.teacherName = lessonPlanning.teacherName || '';
      this.lessonDate = lessonPlanning.lessonDate || '';
      this.status = lessonPlanning.status || '';
      this.objectives = lessonPlanning.objectives || '';
      this.teachingMethod = lessonPlanning.teachingMethod || '';
    }
  }
}
