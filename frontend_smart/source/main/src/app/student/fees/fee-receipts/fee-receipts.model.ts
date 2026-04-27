export interface FeeReceipt {
  id: number;
  receiptNo: string;
  feeType: string;
  paymentDate: string;
  paidAmount: number;
  paymentMode: string;
  status: string; // Success, Printed, Cancelled
}
