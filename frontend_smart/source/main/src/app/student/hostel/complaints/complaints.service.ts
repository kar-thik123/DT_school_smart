import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Complaint } from './complaints.model';

@Injectable({
  providedIn: 'root',
})
export class ComplaintsService {
  private data: Complaint[] = [
    { id: 1, complaintTitle: 'Fan Not Working', complaintType: 'Electrical', date: '2025-01-10', description: 'The fan in room H1-101 is not working properly.', status: 'Pending' },
    { id: 2, complaintTitle: 'Water Leakage', complaintType: 'Plumbing', date: '2025-01-12', description: 'There is a water leakage in the bathroom of room H2-201.', status: 'Resolved' },
    { id: 3, complaintTitle: 'Wi-Fi Issue', complaintType: 'Network', date: '2025-01-15', description: 'Wi-Fi signal is very weak in room H3-301.', status: 'In Progress' },
    { id: 4, complaintTitle: 'Bed Sheet Change', complaintType: 'Housekeeping', date: '2025-01-18', description: 'Requested for a change of bed sheets.', status: 'Resolved' },
    { id: 5, complaintTitle: 'Light Bulb Fused', complaintType: 'Electrical', date: '2025-01-20', description: 'The main light bulb in room H4-402 has fused.', status: 'Pending' },
    { id: 6, complaintTitle: 'Tap Not Closing', complaintType: 'Plumbing', date: '2025-01-22', description: 'The tap in the common washroom is not closing properly.', status: 'In Progress' },
    { id: 7, complaintTitle: 'Noise Complaint', complaintType: 'General', date: '2025-01-25', description: 'Loud noise from the adjacent room late at night.', status: 'Pending' },
    { id: 8, complaintTitle: 'AC Not Cooling', complaintType: 'Electrical', date: '2025-02-01', description: 'The AC in room H1-101 is not cooling effectively.', status: 'Resolved' },
    { id: 9, complaintTitle: 'Door Lock Broken', complaintType: 'Maintenance', date: '2025-02-05', description: 'The door lock of room H2-203 is broken.', status: 'In Progress' },
    { id: 10, complaintTitle: 'Food Quality', complaintType: 'Mess', date: '2025-02-10', description: 'The quality of dinner served today was not good.', status: 'Pending' },
    { id: 11, complaintTitle: 'Cleanliness Issue', complaintType: 'Housekeeping', date: '2025-02-12', description: 'The common area on the 3rd floor is not cleaned properly.', status: 'Resolved' },
    { id: 12, complaintTitle: 'Elevator Not Working', complaintType: 'General', date: '2025-02-15', description: 'The elevator in block B is not working.', status: 'Pending' },
  ];

  getAllComplaints(): Observable<Complaint[]> {
    return of(this.data);
  }

  addComplaint(complaint: Complaint): Observable<Complaint> {
    complaint.id = Math.max(...this.data.map((c) => c.id)) + 1;
    this.data.unshift(complaint);
    return of(complaint);
  }

  updateComplaint(complaint: Complaint): Observable<Complaint> {
    const index = this.data.findIndex((c) => c.id === complaint.id);
    if (index !== -1) {
      this.data[index] = complaint;
    }
    return of(complaint);
  }

  deleteComplaint(id: number): Observable<boolean> {
    this.data = this.data.filter((c) => c.id !== id);
    return of(true);
  }
}
