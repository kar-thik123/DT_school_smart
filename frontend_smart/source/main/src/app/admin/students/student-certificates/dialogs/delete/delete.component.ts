import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentCertificateService } from '../../student-certificates.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  student_name: string;
  certificate_type: string;
}

@Component({
    selector: 'app-student-certificate-delete',
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
export class StudentCertificateDeleteComponent {
  dialogRef = inject<MatDialogRef<StudentCertificateDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentCertificateService = inject(StudentCertificateService);

  confirmDelete(): void {
    this.studentCertificateService.deleteStudentCertificate(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
