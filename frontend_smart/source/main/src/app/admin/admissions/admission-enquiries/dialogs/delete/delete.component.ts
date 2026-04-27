import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AdmissionEnquiryService } from '../../admission-enquiries.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  student_name: string;
}

@Component({
  selector: 'app-admission-enquiry-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AdmissionEnquiryDeleteComponent {
  dialogRef =
    inject<MatDialogRef<AdmissionEnquiryDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  admissionEnquiryService = inject(AdmissionEnquiryService);

  confirmDelete(): void {
    this.admissionEnquiryService
      .deleteAdmissionEnquiry(this.data.id)
      .subscribe({
        next: (response) => {
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Delete Error:', error);
        },
      });
  }
}
