import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { EntranceExamService } from '../../entrance-exams.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  exam_name: string;
}

@Component({
  selector: 'app-entrance-exam-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class EntranceExamDeleteComponent {
  dialogRef = inject<MatDialogRef<EntranceExamDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  entranceExamService = inject(EntranceExamService);

  confirmDelete(): void {
    this.entranceExamService.deleteEntranceExam(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
