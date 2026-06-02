import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface SkillsActionDialogData {
  type: 'image' | 'confirm' | 'edit';
  // Image
  imageUrl?: string;
  // Confirm
  title?: string;
  message?: string;
  actionText?: string;
  actionColor?: string;
  requireRemarks?: boolean;
  // Edit
  skillName?: string;
  currentStatus?: string;
  currentRemarks?: string;
}

@Component({
  selector: 'app-skills-action-dialog',
  templateUrl: './skills-action-dialog.component.html',
  styleUrls: ['./skills-action-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatIconModule
  ]
})
export class SkillsActionDialogComponent {
  status: string = 'pending';
  remarks: string = '';
  showError: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<SkillsActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SkillsActionDialogData
  ) {
    if (this.data.type === 'edit') {
      this.status = data.currentStatus || 'pending';
      this.remarks = data.currentRemarks || '';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSaveEdit(): void {
    if (this.status === 'rejected' && !this.remarks?.trim()) {
      return; 
    }
    this.dialogRef.close({ 
      status: this.status, 
      remarks: this.remarks 
    });
  }

  onConfirm(): void {
    if (this.data.requireRemarks && !this.remarks?.trim()) {
      this.showError = true;
      return;
    }
    this.dialogRef.close({ confirmed: true, remarks: this.remarks });
  }
}
