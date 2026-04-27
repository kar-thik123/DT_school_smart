export class StudentDiscipline {
  id: number;
  img: string;
  student_name: string;
  incident_date: string;
  incident_type: string;
  incident_location: string;
  reported_by: string;
  action_taken: string;
  action_date: string;
  description: string;
  severity: string;
  status: string;

  constructor(studentDiscipline: StudentDiscipline) {
    this.id = studentDiscipline.id || this.getRandomID();
    this.img = studentDiscipline.img || 'assets/images/user/new.jpg';
    this.student_name = studentDiscipline.student_name || '';
    this.incident_date = studentDiscipline.incident_date || '';
    this.incident_type = studentDiscipline.incident_type || '';
    this.incident_location = studentDiscipline.incident_location || '';
    this.reported_by = studentDiscipline.reported_by || '';
    this.action_taken = studentDiscipline.action_taken || '';
    this.action_date = studentDiscipline.action_date || '';
    this.description = studentDiscipline.description || '';
    this.severity = studentDiscipline.severity || '';
    this.status = studentDiscipline.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
