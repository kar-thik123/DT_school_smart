export interface MonthlySummary {
  id: number;
  month: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  percentage: number;
}
