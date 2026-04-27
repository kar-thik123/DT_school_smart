export class CourseCurriculum {
  id: number;
  courseName: string;
  className: string;
  subjectName: string;
  description: string;
  status: string;
  duration: string;
  referenceMaterial: string;

  constructor(courseCurriculum: CourseCurriculum) {
    {
      this.id = courseCurriculum.id || 0;
      this.courseName = courseCurriculum.courseName || '';
      this.className = courseCurriculum.className || '';
      this.subjectName = courseCurriculum.subjectName || '';
      this.description = courseCurriculum.description || '';
      this.status = courseCurriculum.status || '';
      this.duration = courseCurriculum.duration || '';
      this.referenceMaterial = courseCurriculum.referenceMaterial || '';
    }
  }
}
