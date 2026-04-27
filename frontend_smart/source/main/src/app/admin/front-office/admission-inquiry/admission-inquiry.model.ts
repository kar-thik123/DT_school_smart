import { formatDate } from '@angular/common';

export class AdmissionInquiry {
  inquiryId: number;
  studentName: string;
  img: string;
  guardianName: string;
  contactNumber: string;
  emailAddress: string;
  dateOfInquiry: string;
  programOfInterest: string;
  preferredStartDate: string;
  inquirySource: string;
  status: string;
  notes: string;
  followUpDate: string;
  assignedTo: string;
  campusLocation: string;
  previousEducation: string;

  constructor(inquiryData: Partial<AdmissionInquiry> = {}) {
    this.inquiryId = inquiryData.inquiryId || this.getRandomID();
    this.studentName = inquiryData.studentName || '';
    this.img = inquiryData.img || 'assets/images/user/new.jpg';
    this.guardianName = inquiryData.guardianName || '';
    this.contactNumber = inquiryData.contactNumber || '';
    this.emailAddress = inquiryData.emailAddress || '';
    this.dateOfInquiry =
      inquiryData.dateOfInquiry || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.programOfInterest = inquiryData.programOfInterest || '';
    this.preferredStartDate =
      inquiryData.preferredStartDate ||
      formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.inquirySource = inquiryData.inquirySource || 'Website';
    this.status = inquiryData.status || 'New';
    this.notes = inquiryData.notes || '';
    this.followUpDate =
      inquiryData.followUpDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.assignedTo = inquiryData.assignedTo || '';
    this.campusLocation = inquiryData.campusLocation || '';
    this.previousEducation = inquiryData.previousEducation || '';
  }

  // Optional: Method to generate a random ID if needed
  public getRandomID(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
