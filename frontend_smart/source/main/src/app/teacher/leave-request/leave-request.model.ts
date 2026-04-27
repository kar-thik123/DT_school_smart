import { formatDate } from '@angular/common';

export class LeaveRequest {
  leaveId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  dateSubmitted: string;
  reasonForLeave: string;
  approver: string;
  comments: string;

  constructor(leaveRequest: Partial<LeaveRequest>) {
    this.leaveId = leaveRequest.leaveId || this.getRandomID();
    this.leaveType = leaveRequest.leaveType || '';
    this.startDate =
      leaveRequest.startDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.endDate =
      leaveRequest.endDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.totalDays = leaveRequest.totalDays || 0; // You may implement logic to calculate this based on dates
    this.status = leaveRequest.status || '';
    this.dateSubmitted =
      leaveRequest.dateSubmitted || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.reasonForLeave = leaveRequest.reasonForLeave || '';
    this.approver = leaveRequest.approver || '';
    this.comments = leaveRequest.comments || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
