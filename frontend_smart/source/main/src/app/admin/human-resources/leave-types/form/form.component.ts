import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveTypesService } from '../leave-types.service';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LeaveTypes } from '../leave-types.model';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  leaveTypes: LeaveTypes;
}

@Component({
    selector: 'app-leave-types-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.scss'],
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatSelectModule,
        MatOptionModule,
        MatDialogClose,
        MatCardModule,
    ]
})
export class LeaveTypesFormComponent {
  dialogRef = inject<MatDialogRef<LeaveTypesFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveTypesService = inject(LeaveTypesService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string = 'Leave Request';
  isDetails: boolean = false;
  leaveTypesForm!: UntypedFormGroup;
  leaveTypes: LeaveTypes;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.leaveTypes = data.leaveTypes || new LeaveTypes({} as LeaveTypes);
    this.setupForm();
  }

  private setupForm(): void {
    this.isDetails = this.action === 'details';
    this.dialogTitle = this.isDetails
      ? 'Leave Details'
      : this.action === 'edit'
      ? `Edit Leave Type - ${this.leaveTypes.leave_name}`
      : 'New Leave Type';

    this.leaveTypesForm = this.createLeaveForm();
  }

  private createLeaveForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.leaveTypes.id],
      leave_name: [this.leaveTypes.leave_name, [Validators.required]],
      type: [this.leaveTypes.type, [Validators.required]],
      leave_unit: [this.leaveTypes.leave_unit, [Validators.required]],
      status: [this.leaveTypes.status],
      note: [this.leaveTypes.note],
      duration: [this.leaveTypes.duration, [Validators.required]],
      created_by: [this.leaveTypes.created_by, [Validators.required]],
      carry_over: [this.leaveTypes.carry_over],
      notification_period: [this.leaveTypes.notification_period],
      max_leaves: [this.leaveTypes.max_leaves, [Validators.required]],
      annual_limit: [this.leaveTypes.annual_limit, [Validators.required]],
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.leaveTypesForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Required field';
    } else if (control?.hasError('minlength')) {
      return 'Minimum length required';
    }
    return '';
  }

  submit(): void {
    if (this.leaveTypesForm.valid) {
      const leaveTypeData = this.leaveTypesForm.getRawValue();
      console.log(JSON.stringify('leaveTypeData::' + leaveTypeData));
      if (this.action === 'edit') {
        this.leaveTypesService.updateLeaveType(leaveTypeData).subscribe({
          next: (response) => {
            console.log(JSON.stringify('response::' + response));
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally show an error message to the user
          },
        });
      } else {
        this.leaveTypesService.addLeaveType(leaveTypeData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Optionally show an error message to the user
          },
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
