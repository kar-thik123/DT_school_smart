import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { TimetableService } from '../../timetable.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  subject: string;
  day: string;
  timeSlot: string;
}

@Component({
  selector: 'app-my-timetable-delete',
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
export class MyTimetableDeleteComponent {
  dialogRef = inject<MatDialogRef<MyTimetableDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  timetableService = inject(TimetableService);

  confirmDelete(): void {
    this.timetableService.deleteTimetable(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
