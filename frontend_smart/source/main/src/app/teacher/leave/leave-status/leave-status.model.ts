export interface LeaveStatus {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  applyDate: string;
  status: string; // 'Approved', 'Rejected', 'Pending'
  reason: string;
}
