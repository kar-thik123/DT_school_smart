export interface DueFees {
  id: number;
  feeType: string;
  dueDate: string;
  totalAmount: number;
  dueAmount: number;
  lateFee: number;
  totalDue: number;
}
