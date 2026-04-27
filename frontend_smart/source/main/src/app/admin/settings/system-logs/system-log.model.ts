export interface ISystemLog {
  id: number;
  timestamp: string;
  user: string;
  activity: string;
  module: string;
  ipAddress: string;
  severity: string;
  status: string;
}

export class SystemLog implements ISystemLog {
  id: number;
  timestamp: string;
  user: string;
  activity: string;
  module: string;
  ipAddress: string;
  severity: string;
  status: string;

  constructor(log: Partial<SystemLog>) {
    this.id = log.id || this.getRandomID();
    this.timestamp = log.timestamp || new Date().toISOString();
    this.user = log.user || '';
    this.activity = log.activity || '';
    this.module = log.module || '';
    this.ipAddress = log.ipAddress || '';
    this.severity = log.severity || '';
    this.status = log.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
