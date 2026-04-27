import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { IssueReturnService } from '../../issue-return.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete',
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
export class DeleteComponent {
  issueReturnService = inject(IssueReturnService);

  constructor(
    public dialogRef: MatDialogRef<DeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmDelete(): void {
    this.issueReturnService.deleteIssueReturn(this.data.id).subscribe(() => {
      this.dialogRef.close(1);
    });
  }
}
