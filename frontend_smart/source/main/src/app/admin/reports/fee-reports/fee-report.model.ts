export interface IFeeReport {
  id: number;
  img: string;
  reportType: string;
  feeCategory: string;
  dateFrom: string;
  dateTo: string;
  totalAmount: number;
  generatedBy: string;
  date: string;
  status: string;
}

export class FeeReport implements IFeeReport {
  id: number;
  img: string;
  reportType: string;
  feeCategory: string;
  dateFrom: string;
  dateTo: string;
  totalAmount: number;
  generatedBy: string;
  date: string;
  status: string;

  constructor(report: Partial<FeeReport>) {
    this.id = report.id || this.getRandomID();
    this.img = report.img || 'assets/images/user/new.jpg';
    this.reportType = report.reportType || '';
    this.feeCategory = report.feeCategory || '';
    this.dateFrom = report.dateFrom || '';
    this.dateTo = report.dateTo || '';
    this.totalAmount = report.totalAmount || 0;
    this.generatedBy = report.generatedBy || '';
    this.date = report.date || '';
    this.status = report.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
