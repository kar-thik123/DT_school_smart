import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionInquiryService } from '../../admission-inquiry.service';

export interface DialogData {
  inquiryId: number;
  studentName: string;
  contactNumber: string;
}

@Component({
    selector: 'app-admission-inquiry-delete',
    templateUrl: './delete.component.html',
    styleUrls: ['./delete.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatDialogClose,
    ]
})
export class AdmissionInquiryDeleteComponent {
  dialogRef = inject<MatDialogRef<AdmissionInquiryDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  admissionInquiryService = inject(AdmissionInquiryService);


  confirmDelete(): void {
    this.admissionInquiryService
      .deleteAdmissionInquiry(this.data.inquiryId)
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
