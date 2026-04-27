export interface FeeDetails {
  id: number;
  feeType: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string; // Paid, Unpaid, Partial
  paymentMethod: string;
}
