export class LibraryReport {
  id: number;
  report_name: string;
  generated_date: string;
  type: string;
  status: string;

  constructor(libraryReport: LibraryReport) {
    this.id = libraryReport.id || this.getRandomID();
    this.report_name = libraryReport.report_name || '';
    this.generated_date = libraryReport.generated_date || '';
    this.type = libraryReport.type || '';
    this.status = libraryReport.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
