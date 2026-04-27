import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { OnlineApplication } from './online-applications.model';

@Injectable({
  providedIn: 'root',
})
export class OnlineApplicationService {
  dataChange: BehaviorSubject<OnlineApplication[]> = new BehaviorSubject<OnlineApplication[]>([]);

  private staticData: any[] = [
    { id: 1, img: 'assets/images/user/user1.jpg', student_name: 'John Doe', application_no: 'APP001', email: 'john@example.com', mobile: '1234567890', gender: 'Male', date_of_birth: '2005-05-15', course: 'Computer Science', application_date: '2023-11-01', payment_status: 'Paid', application_status: 'Approved', getRandomID: () => 1 },
    { id: 2, img: 'assets/images/user/user2.jpg', student_name: 'Jane Smith', application_no: 'APP002', email: 'jane@example.com', mobile: '2345678901', gender: 'Female', date_of_birth: '2005-06-20', course: 'Business Admin', application_date: '2023-11-02', payment_status: 'Paid', application_status: 'Pending', getRandomID: () => 2 },
    { id: 3, img: 'assets/images/user/user3.jpg', student_name: 'Mike Ross', application_no: 'APP003', email: 'mike@example.com', mobile: '3456789012', gender: 'Male', date_of_birth: '2005-07-10', course: 'Law', application_date: '2023-11-03', payment_status: 'Unpaid', application_status: 'Draft', getRandomID: () => 3 },
    { id: 4, img: 'assets/images/user/user4.jpg', student_name: 'Rachel Zane', application_no: 'APP004', email: 'rachel@example.com', mobile: '4567890123', gender: 'Female', date_of_birth: '2005-08-05', course: 'Law', application_date: '2023-11-04', payment_status: 'Paid', application_status: 'Approved', getRandomID: () => 4 },
    { id: 5, img: 'assets/images/user/user5.jpg', student_name: 'Harvey Specter', application_no: 'APP005', email: 'harvey@example.com', mobile: '5678901234', gender: 'Male', date_of_birth: '2005-09-12', course: 'Economics', application_date: '2023-11-05', payment_status: 'Paid', application_status: 'Under Review', getRandomID: () => 5 },
    { id: 6, img: 'assets/images/user/user6.jpg', student_name: 'Donna Paulsen', application_no: 'APP006', email: 'donna@example.com', mobile: '6789012345', gender: 'Female', date_of_birth: '2005-10-25', course: 'Management', application_date: '2023-11-06', payment_status: 'Paid', application_status: 'Approved', getRandomID: () => 6 },
    { id: 7, img: 'assets/images/user/user7.jpg', student_name: 'Louis Litt', application_no: 'APP007', email: 'louis@example.com', mobile: '7890123456', gender: 'Male', date_of_birth: '2005-11-30', course: 'Finance', application_date: '2023-11-07', payment_status: 'Unpaid', application_status: 'Rejected', getRandomID: () => 7 },
    { id: 8, img: 'assets/images/user/user8.jpg', student_name: 'Jessica Pearson', application_no: 'APP008', email: 'jessica@example.com', mobile: '8901234567', gender: 'Female', date_of_birth: '2005-12-15', course: 'Political Science', application_date: '2023-11-08', payment_status: 'Paid', application_status: 'Approved', getRandomID: () => 8 },
    { id: 9, img: 'assets/images/user/user9.jpg', student_name: 'Oliver Queen', application_no: 'APP009', email: 'oliver@example.com', mobile: '9012345678', gender: 'Male', date_of_birth: '2006-01-20', course: 'Mechanical Eng', application_date: '2023-11-09', payment_status: 'Paid', application_status: 'Pending', getRandomID: () => 9 },
    { id: 10, img: 'assets/images/user/user10.jpg', student_name: 'Barry Allen', application_no: 'APP010', email: 'barry@example.com', mobile: '0123456789', gender: 'Male', date_of_birth: '2006-02-14', course: 'Physics', application_date: '2023-11-10', payment_status: 'Paid', application_status: 'Approved', getRandomID: () => 10 },
    { id: 11, img: 'assets/images/user/user1.jpg', student_name: 'Iris West', application_no: 'APP011', email: 'iris@example.com', mobile: '1122334455', gender: 'Female', date_of_birth: '2006-03-22', course: 'Journalism', application_date: '2023-11-11', payment_status: 'Paid', application_status: 'Under Review', getRandomID: () => 11 },
    { id: 12, img: 'assets/images/user/user2.jpg', student_name: 'Cisco Ramon', application_no: 'APP012', email: 'cisco@example.com', mobile: '2233445566', gender: 'Male', date_of_birth: '2006-04-18', course: 'Electrical Eng', application_date: '2023-11-12', payment_status: 'Unpaid', application_status: 'Pending', getRandomID: () => 12 },
  ];

  get data(): OnlineApplication[] {
    return this.dataChange.value;
  }

  getAllOnlineApplications(): Observable<OnlineApplication[]> {
    this.dataChange.next(this.staticData);
    return of(this.staticData);
  }

  addOnlineApplication(onlineApplication: OnlineApplication): Observable<OnlineApplication> {
    this.staticData.push(onlineApplication);
    this.dataChange.next(this.staticData);
    return of(onlineApplication);
  }

  updateOnlineApplication(onlineApplication: OnlineApplication): Observable<OnlineApplication> {
    const index = this.staticData.findIndex((item) => item.id === onlineApplication.id);
    if (index !== -1) {
      this.staticData[index] = onlineApplication;
      this.dataChange.next(this.staticData);
    }
    return of(onlineApplication);
  }

  deleteOnlineApplication(id: number): Observable<number> {
    const index = this.staticData.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.staticData.splice(index, 1);
      this.dataChange.next(this.staticData);
    }
    return of(id);
  }
}
