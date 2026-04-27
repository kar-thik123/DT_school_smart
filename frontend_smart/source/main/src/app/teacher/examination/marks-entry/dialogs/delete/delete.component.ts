import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { MarksEntryService } from '../../marks-entry.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  studentName: string;
  subject: string;
}

@Component({
  selector: 'app-marks-entry-delete',
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
export class MarksEntryDeleteComponent {
  dialogRef = inject<MatDialogRef<MarksEntryDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  marksService = inject(MarksEntryService);

  confirmDelete(): void {
    this.marksService.deleteMarks(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
