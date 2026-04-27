export interface INotificationSetting {
  id: number;
  notificationType: string;
  channel: string;
  recipients: string;
  frequency: string;
  template: string;
  status: string;
}

export class NotificationSetting implements INotificationSetting {
  id: number;
  notificationType: string;
  channel: string;
  recipients: string;
  frequency: string;
  template: string;
  status: string;

  constructor(setting: Partial<NotificationSetting>) {
    this.id = setting.id || this.getRandomID();
    this.notificationType = setting.notificationType || '';
    this.channel = setting.channel || '';
    this.recipients = setting.recipients || '';
    this.frequency = setting.frequency || '';
    this.template = setting.template || '';
    this.status = setting.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
