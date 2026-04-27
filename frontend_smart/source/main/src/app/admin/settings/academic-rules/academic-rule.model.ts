export interface IAcademicRule {
  id: number;
  ruleName: string;
  category: string;
  appliedTo: string;
  priority: string;
  effectiveDate: string;
  description: string;
  status: string;
}

export class AcademicRule implements IAcademicRule {
  id: number;
  ruleName: string;
  category: string;
  appliedTo: string;
  priority: string;
  effectiveDate: string;
  description: string;
  status: string;

  constructor(rule: Partial<AcademicRule>) {
    this.id = rule.id || this.getRandomID();
    this.ruleName = rule.ruleName || '';
    this.category = rule.category || '';
    this.appliedTo = rule.appliedTo || '';
    this.priority = rule.priority || '';
    this.effectiveDate = rule.effectiveDate || '';
    this.description = rule.description || '';
    this.status = rule.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
