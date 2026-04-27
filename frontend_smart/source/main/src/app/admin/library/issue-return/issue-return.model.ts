export class IssueReturn {
  id: number;
  book_no: string;
  book_title: string;
  student_name: string;
  roll_no: string;
  issue_date: string;
  return_date: string;
  status: string;

  constructor(issueReturn: IssueReturn) {
    this.id = issueReturn.id || this.getRandomID();
    this.book_no = issueReturn.book_no || '';
    this.book_title = issueReturn.book_title || '';
    this.student_name = issueReturn.student_name || '';
    this.roll_no = issueReturn.roll_no || '';
    this.issue_date = issueReturn.issue_date || '';
    this.return_date = issueReturn.return_date || '';
    this.status = issueReturn.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
