export class Subjects {
  id: number;
  subjectName: string;
  subjectCode: string;
  subjectType: string;
  status: string;
  prerequisites: string;
  credits: string;

  constructor(subjects: Subjects) {
    {
      this.id = subjects.id || 0;
      this.subjectName = subjects.subjectName || '';
      this.subjectCode = subjects.subjectCode || '';
      this.subjectType = subjects.subjectType || '';
      this.status = subjects.status || '';
      this.prerequisites = subjects.prerequisites || '';
      this.credits = subjects.credits || '';
    }
  }
}
