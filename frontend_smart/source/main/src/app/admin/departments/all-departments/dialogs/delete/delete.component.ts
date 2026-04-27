import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { DepartmentService } from '../../department.service';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  dName: string;
  hod: string;
  phone: string;
}

@Component({
    selector: 'app-department-delete',
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
export class DepartmentDeleteComponent {
  dialogRef = inject<MatDialogRef<DepartmentDeleteComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  departmentService = inject(DepartmentService);


  confirmDelete(): void {
    this.departmentService.deleteDepartment(this.data.id).subscribe({
      next: (response) => {
        // Handle successful deletion
        this.dialogRef.close(response); // Close the dialog with the response
        // Optionally, refresh a list or show a notification
      },
      error: (error) => {
        console.error('Delete Error:', error);
        // Handle error appropriately
      },
    });
  }
}
