export interface ISmsEmail {
  id: number;
  img: string;
  type: string;
  recipient: string;
  subject: string;
  sentBy: string;
  sentDate: string;
  status: string;
  deliveryStatus: string;
  message: string;
  recipientGroup: string;
}

export class SmsEmail implements ISmsEmail {
  id: number;
  img: string;
  type: string;
  recipient: string;
  subject: string;
  sentBy: string;
  sentDate: string;
  status: string;
  deliveryStatus: string;
  message: string;
  recipientGroup: string;

  constructor(smsEmail: Partial<SmsEmail>) {
    this.id = smsEmail.id || this.getRandomID();
    this.img = smsEmail.img || 'assets/images/user/new.jpg';
    this.type = smsEmail.type || '';
    this.recipient = smsEmail.recipient || '';
    this.subject = smsEmail.subject || '';
    this.sentBy = smsEmail.sentBy || '';
    this.sentDate = smsEmail.sentDate || '';
    this.status = smsEmail.status || '';
    this.deliveryStatus = smsEmail.deliveryStatus || '';
    this.message = smsEmail.message || '';
    this.recipientGroup = smsEmail.recipientGroup || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
