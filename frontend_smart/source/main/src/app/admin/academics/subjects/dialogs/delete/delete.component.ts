import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SubjectsService } from '../../subjects.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  subjectName: string;
}

@Component({
  selector: 'app-subjects-delete',
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
export class SubjectsDeleteComponent {
  dialogRef = inject(MatDialogRef<SubjectsDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  subjectsService = inject(SubjectsService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.subjectsService.deleteSubject(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
