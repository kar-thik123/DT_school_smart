export class Session {
  id: number;
  sessionName: string;
  startDate: string;
  endDate: string;
  status: string;
  instructor: string;
  room: string;

  constructor(session: Session) {
    {
      this.id = session.id || 0;
      this.sessionName = session.sessionName || '';
      this.startDate = session.startDate || '';
      this.endDate = session.endDate || '';
      this.status = session.status || '';
      this.instructor = session.instructor || '';
      this.room = session.room || '';
    }
  }
}
