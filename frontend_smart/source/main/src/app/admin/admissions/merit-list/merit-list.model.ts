export class MeritList {
  id: number;
  student_name: string;
  application_no: string;
  category: string;
  entrance_score: number;
  academic_score: number;
  total_score: number;
  rank: number;
  course: string;
  selection_status: string;

  constructor(meritList: MeritList) {
    this.id = meritList.id || this.getRandomID();
    this.student_name = meritList.student_name || '';
    this.application_no = meritList.application_no || '';
    this.category = meritList.category || '';
    this.entrance_score = meritList.entrance_score || 0;
    this.academic_score = meritList.academic_score || 0;
    this.total_score = meritList.total_score || 0;
    this.rank = meritList.rank || 0;
    this.course = meritList.course || '';
    this.selection_status = meritList.selection_status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
