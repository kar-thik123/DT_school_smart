import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AllocationService } from '../../allocations.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Allocation } from '../../allocations.model';
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
  allocation: Allocation;
}

@Component({
  selector: 'app-allocation-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  standalone: true,
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
    MatDialogClose,
    MatDatepickerModule,
  ],
})
export class AllocationFormComponent {
  dialogRef = inject<MatDialogRef<AllocationFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  allocationService = inject(AllocationService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  allocationForm: UntypedFormGroup;
  allocation: Allocation;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.allocation.student_name
        : 'New Allocation';
    this.allocation =
      this.action === 'edit'
        ? data.allocation
        : new Allocation({} as Allocation);

    this.allocationForm = this.createAllocationForm();
  }

  createAllocationForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.allocation.id],
      img: [this.allocation.img],
      student_name: [this.allocation.student_name, [Validators.required]],
      roll_no: [this.allocation.roll_no, [Validators.required]],
      hostel_name: [this.allocation.hostel_name, [Validators.required]],
      room_no: [this.allocation.room_no, [Validators.required]],
      room_type: [this.allocation.room_type, [Validators.required]],
      allocation_date: [this.allocation.allocation_date, [Validators.required]],
      status: [this.allocation.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.allocationForm.valid) {
      const formData = this.allocationForm.getRawValue();
      if (this.action === 'edit') {
        this.allocationService.updateAllocation(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.allocationService.addAllocation(formData).subscribe({
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
