import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { UserManagementService } from '../../user-management.service';
import { MatButtonModule } from '@angular/material/button';
import { IUser } from '../../user-management.model';

export interface DialogData {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-management-delete',
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
export class UserManagementDeleteComponent {
  dialogRef = inject<MatDialogRef<UserManagementDeleteComponent>>(MatDialogRef);
  data = inject<IUser>(MAT_DIALOG_DATA);
  userManagementService = inject(UserManagementService);

  confirmDelete(): void {
    this.userManagementService.deleteUser(this.data.id).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        alert(err.message || 'Failed to delete user');
      }
    });
  }
}
