export interface OnlinePayment {
  id: number;
  transactionId: string;
  feeType: string;
  paymentDate: string;
  amount: number;
  paymentGateway: string;
  status: string; // Success, Failed, Pending, Refunded
}
