import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentDisciplineService } from '../../student-discipline.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  student_name: string;
  incident_type: string;
}

@Component({
    selector: 'app-student-discipline-delete',
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
export class StudentDisciplineDeleteComponent {
  dialogRef = inject<MatDialogRef<StudentDisciplineDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentDisciplineService = inject(StudentDisciplineService);

  confirmDelete(): void {
    this.studentDisciplineService.deleteStudentDiscipline(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
