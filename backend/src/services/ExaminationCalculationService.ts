export interface SubjectResultInput {
  subject_id: string;
  max_marks: number;
  obtained_marks: number;
  is_absent?: boolean;
}

export interface AggregateResultPayload {
  total_max_marks: number;
  total_obtained_marks: number;
  percentage: number;
}

export class ExaminationCalculationService {
  /**
   * Calculates the aggregate totals and percentage from an array of subject results.
   * Enforces rules for absent students and division-by-zero protection.
   */
  static calculateAggregateResult(subjectResults: SubjectResultInput[]): AggregateResultPayload {
    if (!subjectResults || subjectResults.length === 0) {
      return {
        total_max_marks: 0,
        total_obtained_marks: 0,
        percentage: 0
      };
    }

    let total_max_marks = 0;
    let total_obtained_marks = 0;

    for (const subject of subjectResults) {
      // Regardless of absence, max marks always count towards the total.
      total_max_marks += Number(subject.max_marks || 0);

      // If absent, the student gets 0 obtained marks for this subject.
      if (!subject.is_absent) {
        total_obtained_marks += Number(subject.obtained_marks || 0);
      }
    }

    // Division-by-Zero Protection
    const percentage =
      total_max_marks > 0
        ? Number(((total_obtained_marks / total_max_marks) * 100).toFixed(2))
        : 0;

    return {
      total_max_marks,
      total_obtained_marks,
      percentage
    };
  }
}
