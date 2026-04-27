import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HostelRoomTypeService } from '../../hostel-room-type.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  roomTypeId: number;
  roomTypeName: string;
  roomCategory: string;
  roomPrice: string;
}

@Component({
  selector: 'app-all-hostel-room-types-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AllHostelRoomTypesDeleteComponent {
  dialogRef = inject<MatDialogRef<AllHostelRoomTypesDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  hostelRoomTypeService = inject(HostelRoomTypeService);


  onNoClick(): void {
    this.dialogRef.close(); // Close the dialog without action
  }

  confirmDelete(): void {
    this.hostelRoomTypeService
      .deleteHostelRoomType(this.data.roomTypeId)
      .subscribe({
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
