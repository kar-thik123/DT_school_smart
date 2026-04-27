export interface ResultGenerationData {
  id: number;
  exam_name: string;
  course: string;
  semester: string;
  result_date: string;
  status: string;
}

export class ResultGeneration implements ResultGenerationData {
  id: number;
  exam_name: string;
  course: string;
  semester: string;
  result_date: string;
  status: string;

  constructor(resultGeneration: ResultGenerationData) {
    {
      this.id = resultGeneration.id || this.generateRandomID();
      this.exam_name = resultGeneration.exam_name || '';
      this.course = resultGeneration.course || '';
      this.semester = resultGeneration.semester || '';
      this.result_date = resultGeneration.result_date || '';
      this.status = resultGeneration.status || '';
    }
  }

  private generateRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
