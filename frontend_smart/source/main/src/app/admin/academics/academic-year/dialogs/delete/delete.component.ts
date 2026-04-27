import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AcademicYearService } from '../../academic-year.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  academicYear: string;
}

@Component({
  selector: 'app-academic-year-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class AcademicYearDeleteComponent {
  dialogRef = inject(MatDialogRef<AcademicYearDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  academicYearService = inject(AcademicYearService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.academicYearService.deleteAcademicYear(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
