import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { FeesService } from '../../fees.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Fees } from '../../fees.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  fees: Fees;
}

@Component({
  selector: 'app-all-fees-form',
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
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatDialogClose,
  ],
})
export class AllFeesFormComponent {
  dialogRef = inject<MatDialogRef<AllFeesFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feesService = inject(FeesService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  feesForm: UntypedFormGroup;
  fees: Fees;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.fees.studentName : 'New Fees';
    this.fees = this.action === 'edit' ? data.fees : new Fees({});

    // Create the fees form
    this.feesForm = this.createFeesForm();
  }

  // Create fees form with validators
  createFeesForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.fees.id],
      rollNo: [this.fees.rollNo, [Validators.required]],
      studentName: [this.fees.studentName, [Validators.required]],
      class: [this.fees.class, [Validators.required]],
      feesType: [this.fees.feesType, [Validators.required]],
      invoiceNo: [this.fees.invoiceNo, [Validators.required]],
      paymentDueDate: [
        formatDate(this.fees.paymentDueDate, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      paymentDate: [
        this.fees.paymentDate
          ? formatDate(this.fees.paymentDate, 'yyyy-MM-dd', 'en')
          : null,
      ],
      paymentType: [this.fees.paymentType ? this.fees.paymentType : ''],
      status: [this.fees.status, [Validators.required]],
      amount: [this.fees.amount, [Validators.required]],
      lateFee: [this.fees.lateFee],
      discount: [this.fees.discount],
      createdAt: [formatDate(this.fees.createdAt, 'yyyy-MM-dd', 'en')],
      updatedAt: [
        this.fees.updatedAt
          ? formatDate(this.fees.updatedAt, 'yyyy-MM-dd', 'en')
          : null,
        [Validators.required],
      ],
      notes: [this.fees.notes],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data
  submit(): void {
    if (this.feesForm.valid) {
      const formData = this.feesForm.getRawValue();
      if (this.action === 'edit') {
        this.feesService.updateFees(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.feesService.addFees(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }

  // Close the dialog without submitting
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Confirm and add or update fees
  public confirmAdd(): void {
    this.submit();
  }
}
