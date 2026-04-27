import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveStatusService } from '../../leave-status.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { LeaveStatus } from '../../leave-status.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  leaveStatus: LeaveStatus;
}

@Component({
  selector: 'app-leave-status-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogClose,
  ],
})
export class LeaveStatusFormComponent {
  dialogRef = inject<MatDialogRef<LeaveStatusFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveService = inject(LeaveStatusService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  leaveForm: UntypedFormGroup;
  leaveStatus: LeaveStatus;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Leave: ${this.data.leaveStatus.leaveType}`;
      this.leaveStatus = this.data.leaveStatus;
    } else {
      this.dialogTitle = 'Apply For Leave';
      this.leaveStatus = {} as LeaveStatus;
    }
    this.leaveForm = this.createLeaveForm();
  }

  createLeaveForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.leaveStatus.id],
      applyDate: [this.leaveStatus.applyDate || new Date(), [Validators.required]],
      leaveType: [this.leaveStatus.leaveType, [Validators.required]],
      startDate: [this.leaveStatus.startDate, [Validators.required]],
      endDate: [this.leaveStatus.endDate, [Validators.required]],
      days: [this.leaveStatus.days, [Validators.required]],
      status: [this.leaveStatus.status || 'Pending', [Validators.required]],
      reason: [this.leaveStatus.reason, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.leaveForm.valid) {
      const formData = this.leaveForm.getRawValue();
      formData.startDate = formatDate(this.leaveForm.value.startDate, 'yyyy-MM-dd', 'en-US');
      formData.endDate = formatDate(this.leaveForm.value.endDate, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.leaveService.updateLeaveStatus(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.leaveService.addLeaveStatus(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }


  onNoClick(): void {
    this.dialogRef.close();
  }
}
