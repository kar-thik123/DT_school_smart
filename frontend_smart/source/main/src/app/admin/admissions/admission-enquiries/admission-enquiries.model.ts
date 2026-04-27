export class AdmissionEnquiry {
  id: number;
  student_name: string;
  mobile: string;
  email: string;
  address: string;
  enquiry_date: string;
  last_follow_up: string;
  next_follow_up: string;
  course: string;
  source: string;
  assigned_to: string;
  status: string;
  note: string;

  constructor(admissionEnquiry: AdmissionEnquiry) {
    this.id = admissionEnquiry.id || this.getRandomID();
    this.student_name = admissionEnquiry.student_name || '';
    this.mobile = admissionEnquiry.mobile || '';
    this.email = admissionEnquiry.email || '';
    this.address = admissionEnquiry.address || '';
    this.enquiry_date = admissionEnquiry.enquiry_date || '';
    this.last_follow_up = admissionEnquiry.last_follow_up || '';
    this.next_follow_up = admissionEnquiry.next_follow_up || '';
    this.course = admissionEnquiry.course || '';
    this.source = admissionEnquiry.source || '';
    this.assigned_to = admissionEnquiry.assigned_to || '';
    this.status = admissionEnquiry.status || '';
    this.note = admissionEnquiry.note || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
