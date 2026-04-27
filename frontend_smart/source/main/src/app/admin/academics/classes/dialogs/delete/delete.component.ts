import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ClassesService } from '../../classes.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  className: string;
}

@Component({
  selector: 'app-classes-delete',
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
export class ClassesDeleteComponent {
  dialogRef = inject(MatDialogRef<ClassesDeleteComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  classesService = inject(ClassesService);

  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmDelete(): void {
    this.classesService.deleteClass(this.data.id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Delete Error:', error);
      },
    });
  }
}
