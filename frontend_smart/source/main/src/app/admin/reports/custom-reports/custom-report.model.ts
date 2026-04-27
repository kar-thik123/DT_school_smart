export interface ICustomReport {
  id: number;
  reportName: string;
  description: string;
  category: string;
  createdBy: string;
  date: string;
  status: string;
}

export class CustomReport implements ICustomReport {
  id: number;
  reportName: string;
  description: string;
  category: string;
  createdBy: string;
  date: string;
  status: string;

  constructor(report: Partial<CustomReport>) {
    this.id = report.id || this.getRandomID();
    this.reportName = report.reportName || '';
    this.description = report.description || '';
    this.category = report.category || '';
    this.createdBy = report.createdBy || '';
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
