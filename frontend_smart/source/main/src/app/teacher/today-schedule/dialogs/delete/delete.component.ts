import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ScheduleService } from '../../schedule.service';

@Component({
  selector: 'app-today-schedule-delete',
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
export class TodayScheduleDeleteComponent {
  public dialogRef = inject(MatDialogRef<TodayScheduleDeleteComponent>);
  private scheduleService = inject(ScheduleService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  confirmDelete(): void {
    this.scheduleService.deleteSchedule(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}

