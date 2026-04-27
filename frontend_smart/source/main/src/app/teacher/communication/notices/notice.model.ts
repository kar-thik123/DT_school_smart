export interface Notice {
  id: number;
  title: string;
  date: string;
  category: string; // 'Urgent', 'Information', 'Academic'
  details: string;
}
