import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LessonPlanningService } from '../../lesson-planning.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  lessonName: string;
}

@Component({
  selector: 'app-lesson-planning-delete',
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
export class LessonPlanningDeleteComponent {
  dialogRef = inject(MatDialogRef<LessonPlanningDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  lessonPlanningService = inject(LessonPlanningService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.lessonPlanningService.deleteLesson(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
