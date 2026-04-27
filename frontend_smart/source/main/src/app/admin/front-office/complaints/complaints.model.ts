import { formatDate } from '@angular/common';

export class Complaints {
  complaintId: string;
  complaintDate: string;
  complaintTime: string;
  complainantName: string;
  img: string;
  complainantType: string;
  studentName: string;
  complaintDescription: string;
  department: string;
  status: string;
  assignedTo: string;
  resolutionDescription: string;
  resolutionDate: string;
  createdAt: string;
  updatedAt: string;
  priorityLevel: string;
  feedback: string;

  constructor(complaintData: Partial<Complaints> = {}) {
    this.complaintId = complaintData.complaintId || this.generateComplaintId();
    this.complaintDate =
      complaintData.complaintDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.complaintTime =
      complaintData.complaintTime || formatDate(new Date(), 'hh:mm a', 'en');
    this.complainantName = complaintData.complainantName || '';
    this.img = complaintData.img || 'assets/images/user/new.jpg';
    this.complainantType = complaintData.complainantType || 'Unknown';
    this.studentName = complaintData.studentName || '';
    this.complaintDescription = complaintData.complaintDescription || '';
    this.department = complaintData.department || 'General';
    this.status = complaintData.status || 'Open';
    this.assignedTo = complaintData.assignedTo || 'Unassigned';
    this.resolutionDescription = complaintData.resolutionDescription || '';
    this.resolutionDate =
      complaintData.resolutionDate ||
      formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.createdAt =
      complaintData.createdAt ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
    this.updatedAt =
      complaintData.updatedAt ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
    this.priorityLevel = complaintData.priorityLevel || 'Low';
    this.feedback = complaintData.feedback || '';
  }

  private generateComplaintId(): string {
    const S4 = () => ((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `C${S4()}`;
  }
}
