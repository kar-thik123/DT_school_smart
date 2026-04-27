import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HostelRoomListService } from '../../hostel-room-list.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  roomId: number;
  roomNumber: string;
  roomType: string;
  capacity: string;
}

@Component({
  selector: 'app-all-hostel-room-lists-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllHostelRoomListsDeleteComponent {
  dialogRef = inject<MatDialogRef<AllHostelRoomListsDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  hostelRoomListService = inject(HostelRoomListService);


  onNoClick(): void {
    this.dialogRef.close(); // Close the dialog without action
  }

  confirmDelete(): void {
    this.hostelRoomListService.deleteHostelRoom(this.data.roomId).subscribe({
      next: (response) => {
        // Handle successful deletion
        this.dialogRef.close(response); // Close the dialog with the response
        // Optionally, refresh a list or show a notification
      },
      error: (error) => {
        console.error('Delete Error:', error);
        // Handle error appropriately
      },
    });
  }
}
