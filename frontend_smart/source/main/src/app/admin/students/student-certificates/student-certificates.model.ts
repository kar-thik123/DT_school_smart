export class StudentCertificate {
  id: number;
  img: string;
  student_name: string;
  certificate_type: string;
  certificate_no: string;
  issued_by: string;
  issue_date: string;
  expiry_date: string;
  category: string;
  description: string;
  status: string;

  constructor(studentCertificate: StudentCertificate) {
    this.id = studentCertificate.id || this.getRandomID();
    this.img = studentCertificate.img || 'assets/images/user/new.jpg';
    this.student_name = studentCertificate.student_name || '';
    this.certificate_type = studentCertificate.certificate_type || '';
    this.certificate_no = studentCertificate.certificate_no || '';
    this.issued_by = studentCertificate.issued_by || '';
    this.issue_date = studentCertificate.issue_date || '';
    this.expiry_date = studentCertificate.expiry_date || '';
    this.category = studentCertificate.category || '';
    this.description = studentCertificate.description || '';
    this.status = studentCertificate.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
