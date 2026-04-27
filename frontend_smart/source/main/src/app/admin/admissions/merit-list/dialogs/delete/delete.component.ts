import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { MeritListService } from '../../merit-list.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  student_name: string;
}

@Component({
  selector: 'app-merit-list-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
})
export class MeritListDeleteComponent {
  dialogRef = inject<MatDialogRef<MeritListDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  meritListService = inject(MeritListService);

  confirmDelete(): void {
    this.meritListService.deleteMeritList(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
