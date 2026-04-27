import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AdmissionEnquiry } from './admission-enquiries.model';

@Injectable({
  providedIn: 'root',
})
export class AdmissionEnquiryService {
  dataChange: BehaviorSubject<AdmissionEnquiry[]> = new BehaviorSubject<AdmissionEnquiry[]>([]);

  private staticData: any[] = [
    { id: 1, student_name: 'John Doe', mobile: '1234567890', email: 'john@example.com', address: '123 St, NY', enquiry_date: '2023-12-01', last_follow_up: '2023-12-05', next_follow_up: '2023-12-10', course: 'B.Tech', source: 'Website', assigned_to: 'Advisor A', status: 'In Progress', note: 'Interested in CS', getRandomID: () => 1 },
    { id: 2, student_name: 'Jane Smith', mobile: '2345678901', email: 'jane@example.com', address: '456 Ave, CA', enquiry_date: '2023-12-02', last_follow_up: '2023-12-06', next_follow_up: '2023-12-11', course: 'MBA', source: 'Referral', assigned_to: 'Advisor B', status: 'Pending', note: 'Asked for scholarship', getRandomID: () => 2 },
    { id: 3, student_name: 'Mike Ross', mobile: '3456789012', email: 'mike@example.com', address: '789 Blvd, TX', enquiry_date: '2023-12-03', last_follow_up: '2023-12-07', next_follow_up: '2023-12-12', course: 'B.Com', source: 'Facebook', assigned_to: 'Advisor C', status: 'Completed', note: 'Applied online', getRandomID: () => 3 },
    { id: 4, student_name: 'Rachel Zane', mobile: '4567890123', email: 'rachel@example.com', address: '101 Dr, FL', enquiry_date: '2023-12-04', last_follow_up: '2023-12-08', next_follow_up: '2023-12-13', course: 'Law', source: 'Instagram', assigned_to: 'Advisor A', status: 'In Progress', note: 'Needs financial aid', getRandomID: () => 4 },
    { id: 5, student_name: 'Harvey Specter', mobile: '5678901234', email: 'harvey@example.com', address: '202 Way, WA', enquiry_date: '2023-12-05', last_follow_up: '2023-12-09', next_follow_up: '2023-12-14', course: 'Law', source: 'LinkedIn', assigned_to: 'Advisor B', status: 'Pending', note: 'High priority', getRandomID: () => 5 },
    { id: 6, student_name: 'Donna Paulsen', mobile: '6789012345', email: 'donna@example.com', address: '303 Ln, OR', enquiry_date: '2023-12-06', last_follow_up: '2023-12-10', next_follow_up: '2023-12-15', course: 'Management', source: 'Website', assigned_to: 'Advisor C', status: 'Completed', note: 'Highly interested', getRandomID: () => 6 },
    { id: 7, student_name: 'Louis Litt', mobile: '7890123456', email: 'louis@example.com', address: '404 Cir, NV', enquiry_date: '2023-12-07', last_follow_up: '2023-12-11', next_follow_up: '2023-12-16', course: 'Finance', source: 'Referral', assigned_to: 'Advisor A', status: 'In Progress', note: 'Asked about faculty', getRandomID: () => 7 },
    { id: 8, student_name: 'Jessica Pearson', mobile: '8901234567', email: 'jessica@example.com', address: '505 Pkwy, AZ', enquiry_date: '2023-12-08', last_follow_up: '2023-12-12', next_follow_up: '2023-12-17', course: 'Law', source: 'Facebook', assigned_to: 'Advisor B', status: 'Pending', note: 'International student', getRandomID: () => 8 },
    { id: 9, student_name: 'Oliver Queen', mobile: '9012345678', email: 'oliver@example.com', address: '606 Rd, OH', enquiry_date: '2023-12-09', last_follow_up: '2023-12-13', next_follow_up: '2023-12-18', course: 'B.Sc', source: 'Instagram', assigned_to: 'Advisor C', status: 'Completed', note: 'Transfer student', getRandomID: () => 9 },
    { id: 10, student_name: 'Barry Allen', mobile: '0123456789', email: 'barry@example.com', address: '707 Ter, PA', enquiry_date: '2023-12-10', last_follow_up: '2023-12-14', next_follow_up: '2023-12-19', course: 'Science', source: 'LinkedIn', assigned_to: 'Advisor A', status: 'In Progress', note: 'Needs fast track', getRandomID: () => 10 },
    { id: 11, student_name: 'Iris West', mobile: '1122334455', email: 'iris@example.com', address: '808 Sq, IL', enquiry_date: '2023-12-11', last_follow_up: '2023-12-15', next_follow_up: '2023-12-20', course: 'Journalism', source: 'Website', assigned_to: 'Advisor B', status: 'Pending', note: 'Inquired about campus', getRandomID: () => 11 },
    { id: 12, student_name: 'Cisco Ramon', mobile: '2233445566', email: 'cisco@example.com', address: '909 Pl, GA', enquiry_date: '2023-12-12', last_follow_up: '2023-12-16', next_follow_up: '2023-12-21', course: 'Engineering', source: 'Referral', assigned_to: 'Advisor C', status: 'Completed', note: 'Confirmed admission', getRandomID: () => 12 },
  ];

  get data(): AdmissionEnquiry[] {
    return this.dataChange.value;
  }

  getAllAdmissionEnquiries(): Observable<AdmissionEnquiry[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addAdmissionEnquiry(admissionEnquiry: AdmissionEnquiry): Observable<AdmissionEnquiry> {
    this.staticData.push(admissionEnquiry);
    this.dataChange.next(this.staticData);
    return of(admissionEnquiry);
  }

  updateAdmissionEnquiry(admissionEnquiry: AdmissionEnquiry): Observable<AdmissionEnquiry> {
    const index = this.staticData.findIndex((item) => item.id === admissionEnquiry.id);
    if (index !== -1) {
      this.staticData[index] = admissionEnquiry;
      this.dataChange.next(this.staticData);
    }
    return of(admissionEnquiry);
  }

  deleteAdmissionEnquiry(id: number): Observable<number> {
    const index = this.staticData.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
