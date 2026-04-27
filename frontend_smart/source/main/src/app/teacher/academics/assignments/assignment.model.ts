export interface Assignment {
  id: number;
  class: string;
  subject: string;
  title: string;
  assignedDate: string;
  dueDate: string;
  status: string; // 'Active', 'Closed'
  submissions: number;
}
