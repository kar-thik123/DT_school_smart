import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AssignClassTeacherService } from '../../assign-class-teacher.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  teacherId: number;
  teacherName: string;
  className: string;
}

@Component({
    selector: 'app-assign-class-teacher-delete',
    templateUrl: './delete.component.html',
    styleUrls: ['./delete.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatDialogClose,
    ]
})
export class AssignClassTeacherDeleteComponent {
  dialogRef = inject<MatDialogRef<AssignClassTeacherDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  assignClassTeacherService = inject(AssignClassTeacherService);


  confirmDelete(): void {
    this.assignClassTeacherService
      .deleteClassTeacherAssignment(this.data.teacherId)
      .subscribe({
        next: (response) => {
          // Handle successful deletion
          this.dialogRef.close(response); // Close the dialog with the response
          // Optionally, handle other UI actions like refreshing a list
        },
        error: (error) => {
          console.error('Delete Error:', error);
          // Handle error appropriately
        },
      });
  }
}
