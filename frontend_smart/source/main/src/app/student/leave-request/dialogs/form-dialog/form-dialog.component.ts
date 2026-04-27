import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveRequestService } from '../../leave-request.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LeaveRequest } from '../../leave-request.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

export interface DialogData {
  id: number;
  action: string;
  leaveRequest: LeaveRequest;
}

@Component({
  selector: 'app-std-leave-request-form',
  standalone: true,
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
export class StdLeaveRequestFormComponent {
  dialogRef = inject<MatDialogRef<StdLeaveRequestFormComponent>>(MatDialogRef);
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
      this.dialogTitle = data.leaveRequest.reason;
      this.leaveRequest = data.leaveRequest;
      this.leaveRequestForm = this.createLeaveRequestForm();
    } else if (this.action === 'details') {
      this.leaveRequest = data.leaveRequest;
      this.isDetails = true;
    } else {
      this.isDetails = false;
      this.dialogTitle = 'New Leave Request';
      const blankObject = {} as LeaveRequest;
      this.leaveRequest = new LeaveRequest(blankObject);
      this.leaveRequestForm = this.createLeaveRequestForm();
    }
  }

  // Create the leave request form
  createLeaveRequestForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.leaveRequest.id],
      class: [this.leaveRequest.class, [Validators.required]],
      section: [this.leaveRequest.section, [Validators.required]],
      applyDate: [this.leaveRequest.applyDate, [Validators.required]],
      fromDate: [this.leaveRequest.fromDate, [Validators.required]],
      toDate: [this.leaveRequest.toDate, [Validators.required]],
      status: [this.leaveRequest.status, [Validators.required]],
      reason: [this.leaveRequest.reason, [Validators.required]],
    });
  }

  // Generic error message retrieval
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit the form
  submit(): void {
    if (this.leaveRequestForm?.valid) {
      const formData = this.leaveRequestForm.getRawValue();
      if (this.action === 'edit') {
        this.leaveRequestService.updateLeaveRequest(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog with response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.leaveRequestService.addLeaveRequest(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog with response
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }

  // Close dialog without actions
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Trigger submit on confirmation
  public confirmAdd(): void {
    this.submit();
  }
}
