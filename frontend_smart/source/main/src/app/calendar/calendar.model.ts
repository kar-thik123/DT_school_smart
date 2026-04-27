export class Calendar {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  details: string;

  constructor(calendar: Calendar) {
    {
      this.id = calendar.id || this.getRandomID();
      this.title = calendar.title || '';
      this.category = calendar.category || '';
      this.startDate = calendar.startDate
        ? new Date(calendar.startDate).toISOString()
        : new Date().toISOString();
      this.endDate = calendar.endDate
        ? new Date(calendar.endDate).toISOString()
        : new Date().toISOString();
      this.details = calendar.details || '';
    }
  }
  public getRandomID(): string {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return (S4() + S4()).toString(); // Convert to string
  }
}
