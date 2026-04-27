import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeaveBalanceService } from '../leave-balance.service';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LeaveBalance } from '../leave-balance.model';
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
  leaveBalance: LeaveBalance;
}

@Component({
    selector: 'app-leave-balance-form',
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
export class LeaveBalanceFormComponent {
  dialogRef = inject<MatDialogRef<LeaveBalanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leaveBalanceService = inject(LeaveBalanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string = 'Leave Balance';
  isDetails: boolean = false;
  leaveBalanceForm!: UntypedFormGroup;
  leaveBalance: LeaveBalance;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.leaveBalance =
      data.leaveBalance || new LeaveBalance({} as LeaveBalance);
    this.setupForm();
  }

  private setupForm(): void {
    if (this.action === 'details') {
      this.isDetails = true;
      this.dialogTitle = 'Leave Details';
    } else if (this.action === 'edit') {
      this.dialogTitle = `${this.leaveBalance.name}`;
      this.isDetails = false;
    } else {
      this.dialogTitle = 'New Leave Balance';
      this.leaveBalance = new LeaveBalance({} as LeaveBalance);
      this.isDetails = false;
    }
    this.leaveBalanceForm = this.createLeaveBalanceForm();
  }

  private createLeaveBalanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.leaveBalance.id],
      img: [this.leaveBalance.img],
      name: [this.leaveBalance.name],
      prev: [this.leaveBalance.prev, [Validators.required]],
      current: [this.leaveBalance.current, [Validators.required]],
      total: [this.leaveBalance.total, [Validators.required]],
      used: [this.leaveBalance.used, [Validators.required]],
      accepted: [this.leaveBalance.accepted, [Validators.required]],
      rejected: [this.leaveBalance.rejected, [Validators.required]],
      expired: [this.leaveBalance.expired, [Validators.required]],
      carryOver: [this.leaveBalance.carryOver, [Validators.required]],
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.leaveBalanceForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Required field';
    } else if (control?.hasError('minlength')) {
      return 'Minimum length required';
    }
    return '';
  }

  submit(): void {
    if (this.leaveBalanceForm.valid) {
      const leaveBalanceData = this.leaveBalanceForm.getRawValue();
      if (this.action === 'edit') {
        this.leaveBalanceService
          .updateLeaveBalance(leaveBalanceData)
          .subscribe({
            next: (response) => {
              this.dialogRef.close(response);
            },
            error: (error) => {
              console.error('Update Error:', error);
              // Optionally show an error message to the user
            },
          });
      } else {
        this.leaveBalanceService.addLeaveBalance(leaveBalanceData).subscribe({
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
