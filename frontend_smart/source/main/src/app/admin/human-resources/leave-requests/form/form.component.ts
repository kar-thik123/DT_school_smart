import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { LeavesService } from '../leaves.service';
import {
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Leaves } from '../leaves.model';
import { DatePipe, formatDate } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatSnackBarVerticalPosition,
  MatSnackBarHorizontalPosition,
  MatSnackBar,
} from '@angular/material/snack-bar';

export interface DialogData {
  id: number;
  action: string;
  leaves: Leaves;
}

@Component({
    selector: 'app-leave-request-form',
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
        DatePipe,
    ]
})
export class LeaveRequestFormComponent {
  dialogRef = inject<MatDialogRef<LeaveRequestFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  leavesService = inject(LeavesService);
  private fb = inject(UntypedFormBuilder);
  private snackBar = inject(MatSnackBar);

  action: string;
  dialogTitle: string = 'Leave Request';
  isDetails: boolean = false;
  leavesForm!: UntypedFormGroup;
  leaves: Leaves;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.leaves = data.leaves || new Leaves({} as Leaves);
    this.setupForm();
  }

  private setupForm(): void {
    switch (this.action) {
      case 'details':
        this.isDetails = true;
        this.dialogTitle = 'Leave Details';
        break;
      case 'edit':
        this.dialogTitle = `${this.leaves.name}`;
        this.isDetails = false;
        break;
      default:
        this.dialogTitle = 'New Leave Request';
        this.isDetails = false;
        this.leaves = new Leaves({} as Leaves);
        break;
    }
    this.leavesForm = this.createLeaveForm();
  }

  private createLeaveForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.leaves.id],
      img: [this.leaves.img],
      name: [this.leaves.name],
      employeeId: [this.leaves.employeeId, [Validators.required]],
      department: [this.leaves.department, [Validators.required]],
      type: [this.leaves.type, [Validators.required]],
      from: [
        formatDate(this.leaves.from, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      leaveTo: [
        formatDate(this.leaves.leaveTo, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      noOfDays: [this.leaves.noOfDays],
      durationType: [this.leaves.durationType, [Validators.required]],
      status: [this.leaves.status],
      reason: [this.leaves.reason],
      note: [this.leaves.note],
      requestedOn: [
        formatDate(this.leaves.requestedOn, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      approvedBy: [this.leaves.approvedBy],
      approvalDate: [
        this.leaves.approvalDate
          ? formatDate(this.leaves.approvalDate, 'yyyy-MM-dd', 'en')
          : '',
      ],
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.leavesForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Required field';
    } else if (control?.hasError('minlength')) {
      return 'Minimum length required';
    }
    return '';
  }

  submit(): void {
    if (this.leavesForm.valid) {
      const leaveData = this.leavesForm.getRawValue();
      if (this.action === 'edit') {
        this.leavesService.updateLeaves(leaveData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally show an error message to the user
          },
        });
      } else {
        this.leavesService.addLeaves(leaveData).subscribe({
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

  approve(): void {
    // Open the snack bar with the success message
    this.showNotification(
      'snackbar-success',
      'Leave request approved!',
      'bottom',
      'center'
    );

    // Optionally close the dialog if approval is successful
    this.dialogRef.close('approved');
  }

  reject(): void {
    this.showNotification(
      'snackbar-danger',
      'Leave request rejected',
      'bottom',
      'center'
    );

    // Close the dialog with rejection status
    this.dialogRef.close('rejected');
  }

  showNotification(
    colorName: string,
    text: string,
    placementFrom: MatSnackBarVerticalPosition,
    placementAlign: MatSnackBarHorizontalPosition
  ) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}
