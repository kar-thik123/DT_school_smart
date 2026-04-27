export interface Schedule {
  id: number;
  subject: string;
  class: string;
  time: string;
  duration: string;
  room: string;
  status: string; // e.g., 'Upcoming', 'Completed', 'Ongoing'
}
