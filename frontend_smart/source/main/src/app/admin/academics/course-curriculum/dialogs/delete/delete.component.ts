import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { CourseCurriculumService } from '../../course-curriculum.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  courseName: string;
}

@Component({
  selector: 'app-course-curriculum-delete',
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
export class CourseCurriculumDeleteComponent {
  dialogRef = inject(MatDialogRef<CourseCurriculumDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  courseCurriculumService = inject(CourseCurriculumService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.courseCurriculumService.deleteCurriculum(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
