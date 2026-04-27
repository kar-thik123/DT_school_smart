export interface SubstitutionRequest {
  id: number;
  date: string;
  timeSlot: string;
  class: string;
  subject: string;
  reason: string;
  status: string; // 'Pending', 'Approved', 'Rejected'
}
