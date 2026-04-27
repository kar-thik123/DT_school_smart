import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LessonPlanService } from '../../lesson-plan.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  topic: string;
  class: string;
  date: string;
}

@Component({
  selector: 'app-lesson-plan-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
  ],
})
export class LessonPlanDeleteComponent {
  dialogRef = inject<MatDialogRef<LessonPlanDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  lessonService = inject(LessonPlanService);

  confirmDelete(): void {
    this.lessonService.deleteLessonPlan(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }

}
