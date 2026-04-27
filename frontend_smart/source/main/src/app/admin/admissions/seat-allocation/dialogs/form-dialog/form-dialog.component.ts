import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SeatAllocationService } from '../../seat-allocation.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SeatAllocation } from '../../seat-allocation.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface DialogData {
  id: number;
  action: string;
  seatAllocation: SeatAllocation;
}

@Component({
  selector: 'app-seat-allocation-form',
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
    MatCheckboxModule,
    MatDialogClose,
  ]
})
export class SeatAllocationFormComponent {
  dialogRef = inject<MatDialogRef<SeatAllocationFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  seatAllocationService = inject(SeatAllocationService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  seatAllocationForm: UntypedFormGroup;
  seatAllocation: SeatAllocation;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.seatAllocation.student_name
        : 'New Allocation';
    this.seatAllocation =
      this.action === 'edit'
        ? data.seatAllocation
        : new SeatAllocation({} as SeatAllocation);
    this.seatAllocationForm = this.createSeatAllocationForm();
  }

  createSeatAllocationForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.seatAllocation.id],
      student_name: [this.seatAllocation.student_name, [Validators.required]],
      application_no: [this.seatAllocation.application_no, [Validators.required]],
      course: [this.seatAllocation.course, [Validators.required]],
      category: [this.seatAllocation.category, [Validators.required]],
      allotted_seat_type: [this.seatAllocation.allotted_seat_type, [Validators.required]],
      allocation_date: [this.seatAllocation.allocation_date, [Validators.required]],
      reporting_date: [this.seatAllocation.reporting_date, [Validators.required]],
      status: [this.seatAllocation.status, [Validators.required]],
      fees_paid: [this.seatAllocation.fees_paid],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.seatAllocationForm.valid) {
      const formData = this.seatAllocationForm.getRawValue();
      if (this.action === 'edit') {
        this.seatAllocationService.updateSeatAllocation(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.seatAllocationService.addSeatAllocation(formData).subscribe({
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

  public confirmAdd(): void {
    this.submit();
  }
}
