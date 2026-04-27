export class Assignment {
  id: number;
  className: string;
  subjectName: string;
  teacherName: string;
  assignmentDate: string;
  status: string;
  title: string;
  deadline: string;
  details: string;

  constructor(assignment: Assignment) {
    {
      this.id = assignment.id || 0;
      this.className = assignment.className || '';
      this.subjectName = assignment.subjectName || '';
      this.teacherName = assignment.teacherName || '';
      this.assignmentDate = assignment.assignmentDate || '';
      this.status = assignment.status || '';
      this.title = assignment.title || '';
      this.deadline = assignment.deadline || '';
      this.details = assignment.details || '';
    }
  }
}
