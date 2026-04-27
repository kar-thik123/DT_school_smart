import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HostelFeesService } from '../../hostel-fees.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { HostelFee } from '../../hostel-fees.model';
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
  fee: HostelFee;
}

@Component({
  selector: 'app-fee-form',
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
export class FeeFormComponent {
  dialogRef = inject<MatDialogRef<FeeFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feesService = inject(HostelFeesService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  feeForm: UntypedFormGroup;
  fee: HostelFee;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.fee.student_name
        : 'New Fee Record';
    this.fee =
      this.action === 'edit'
        ? data.fee
        : new HostelFee({} as HostelFee);

    this.feeForm = this.createFeeForm();
  }

  createFeeForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.fee.id],
      img: [this.fee.img],
      student_name: [this.fee.student_name, [Validators.required]],
      roll_no: [this.fee.roll_no, [Validators.required]],
      hostel_name: [this.fee.hostel_name, [Validators.required]],
      room_no: [this.fee.room_no, [Validators.required]],
      amount: [this.fee.amount, [Validators.required]],
      payment_date: [this.fee.payment_date, [Validators.required]],
      fee_type: [this.fee.fee_type, [Validators.required]],
      payment_status: [this.fee.payment_status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.feeForm.valid) {
      const formData = this.feeForm.getRawValue();
      if (this.action === 'edit') {
        this.feesService.updateFee(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.feesService.addFee(formData).subscribe({
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
