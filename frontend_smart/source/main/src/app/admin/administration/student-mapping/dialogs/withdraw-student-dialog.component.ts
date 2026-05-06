import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-withdraw-student-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Withdraw Student</h2>
    <mat-dialog-content>
      <p class="text-danger">Warning: This will mark the student's enrollment as WITHDRAWN and remove them from active class rosters.</p>
      <p class="text-muted small">Their academic history, attendance, and exam marks will be preserved.</p>
      <div class="pt-3">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Reason for Withdrawal</mat-label>
          <textarea matInput [(ngModel)]="data.payload.reason" rows="3" placeholder="e.g. Relocated to another city"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [disabled]="!data.payload.reason" [mat-dialog-close]="data.payload">Confirm Withdrawal</button>
    </mat-dialog-actions>
  `
})
export class WithdrawStudentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WithdrawStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
