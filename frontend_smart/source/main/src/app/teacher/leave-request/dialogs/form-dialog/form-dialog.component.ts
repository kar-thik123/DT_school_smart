import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LeaveRequest } from '../../leave-request.model';
import { LeaveRequestService } from '../../leave-request.service';

export interface DialogData {
  id: number;
  action: string;
  leaveRequest: LeaveRequest;
}

@Component({
  selector: 'app-teacher-leave-request-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
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
    MatCardModule,
    DatePipe,
  ],
})
export class TeacherLeaveRequestFormComponent {
  dialogRef = inject<MatDialogRef<TeacherLeaveRequestFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveRequestService = inject(LeaveRequestService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle?: string;
  leaveRequestForm?: UntypedFormGroup;
  leaveRequest: LeaveRequest;
  isDetails = false;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    if (this.action === 'edit') {
      this.isDetails = false;
      this.dialogTitle = data.leaveRequest.leaveType;
      this.leaveRequest = data.leaveRequest;
      this.leaveRequestForm = this.createLeaveRequestsForm();
    } else if (this.action === 'details') {
      this.leaveRequest = data.leaveRequest;
      this.isDetails = true;
    } else {
      this.isDetails = false;
      this.dialogTitle = 'New Leave Request';
      const blankObject = {} as LeaveRequest;
      this.leaveRequest = new LeaveRequest(blankObject);
      this.leaveRequestForm = this.createLeaveRequestsForm();
    }
  }

  // Create the leaveRequest form with required validators
  createLeaveRequestsForm(): UntypedFormGroup {
    return this.fb.group({
      leaveId: [this.leaveRequest.leaveId],
      leaveType: [this.leaveRequest.leaveType, [Validators.required]],
      startDate: [this.leaveRequest.startDate, [Validators.required]],
      endDate: [this.leaveRequest.endDate, [Validators.required]],
      totalDays: [this.leaveRequest.totalDays, [Validators.required]],
      status: [this.leaveRequest.status, [Validators.required]],
      dateSubmitted: [this.leaveRequest.dateSubmitted, [Validators.required]],
      reasonForLeave: [this.leaveRequest.reasonForLeave, [Validators.required]],
      approver: [this.leaveRequest.approver, [Validators.required]],
      comments: [this.leaveRequest.comments, [Validators.required]],
    });
  }

  // Handle error messages for form controls
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data, handle edit or add based on action type
  submit(): void {
    if (this.leaveRequestForm?.valid) {
      const formData = this.leaveRequestForm?.getRawValue();
      formData.startDate = formatDate(this.leaveRequestForm.value.startDate, 'yyyy-MM-dd', 'en-US');
      formData.endDate = formatDate(this.leaveRequestForm.value.endDate, 'yyyy-MM-dd', 'en-US');
      formData.dateSubmitted = formatDate(this.leaveRequestForm.value.dateSubmitted, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.leaveRequestService.updateLeaveRequest(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.leaveRequestService.addLeaveRequest(formData).subscribe({
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

  // Close dialog without any actions
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Trigger submit method on confirmation
  public confirmAdd(): void {
    this.submit();
  }
}
