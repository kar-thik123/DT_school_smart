export interface IInstituteProfile {
  id: number;
  img: string;
  instituteName: string;
  code: string;
  type: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: string;
}

export class InstituteProfile implements IInstituteProfile {
  id: number;
  img: string;
  instituteName: string;
  code: string;
  type: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: string;

  constructor(profile: Partial<InstituteProfile>) {
    this.id = profile.id || this.getRandomID();
    this.img = profile.img || 'assets/images/user/new.jpg';
    this.instituteName = profile.instituteName || '';
    this.code = profile.code || '';
    this.type = profile.type || '';
    this.location = profile.location || '';
    this.contactPerson = profile.contactPerson || '';
    this.phone = profile.phone || '';
    this.email = profile.email || '';
    this.status = profile.status || '';
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
