import { formatDate } from '@angular/common';

export class Visitors {
  visitorId: string;
  visitorName: string;
  visitDate: string;
  visitTime: string;
  purposeOfVisit: string;
  contactNumber: string;
  visitorType: string;
  visitorsName: string;
  departmentPersonVisited: string;
  checkOutTime: string;
  idProofType: string;
  idProofNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;

  constructor(visitorData: Partial<Visitors> = {}) {
    this.visitorId = visitorData.visitorId || this.getRandomID();
    this.visitorName = visitorData.visitorName || '';
    this.visitDate =
      visitorData.visitDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.visitTime =
      visitorData.visitTime || formatDate(new Date(), 'hh:mm a', 'en');
    this.purposeOfVisit = visitorData.purposeOfVisit || '';
    this.contactNumber = visitorData.contactNumber || '';
    this.visitorType = visitorData.visitorType || '';
    this.visitorsName = visitorData.visitorsName || '';
    this.departmentPersonVisited = visitorData.departmentPersonVisited || '';
    this.checkOutTime = visitorData.checkOutTime || '';
    this.idProofType = visitorData.idProofType || '';
    this.idProofNumber = visitorData.idProofNumber || '';
    this.notes = visitorData.notes || '';
    this.createdAt =
      visitorData.createdAt ||
      formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'", 'en');
    this.updatedAt =
      visitorData.updatedAt ||
      formatDate(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'", 'en');
  }

  // Method to generate a random ID with V prefix
  public getRandomID(): string {
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `V${randomNum}`;
  }
}
