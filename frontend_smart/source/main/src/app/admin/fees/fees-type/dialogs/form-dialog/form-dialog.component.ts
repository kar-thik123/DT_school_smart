import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { FeesTypeService } from '../../fees-type.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FeesType } from '../../fees-type.model';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  feesType: FeesType;
}

@Component({
  selector: 'app-all-fees-types-form',
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
    MatInputModule,
    MatDatepickerModule,
    MatDialogClose,
  ],
})
export class AllFeesTypesFormComponent {
  dialogRef = inject<MatDialogRef<AllFeesTypesFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  feesTypeService = inject(FeesTypeService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  feesTypeForm: UntypedFormGroup;
  feesType: FeesType;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.feesType.feeTypeName : 'New Fee Type';
    this.feesType = this.action === 'edit' ? data.feesType : new FeesType({});

    // Create the feesType form
    this.feesTypeForm = this.createFeesTypeForm();
  }

  // Create feesType form with validators
  createFeesTypeForm(): UntypedFormGroup {
    return this.fb.group({
      feeTypeId: [this.feesType.feeTypeId],
      feeTypeName: [
        this.feesType.feeTypeName,
        [Validators.required, Validators.maxLength(100)],
      ],
      category: [
        this.feesType.category,
        [Validators.required, Validators.maxLength(50)],
      ],
      description: [this.feesType.description, [Validators.maxLength(500)]],
      amount: [
        this.feesType.amount,
        [Validators.required, Validators.min(0), Validators.max(100000)],
      ],
      applicableClasses: [
        this.feesType.applicableClasses,
        [Validators.maxLength(200)],
      ],
      frequency: [
        this.feesType.frequency || 'Annually',
        [Validators.required, Validators.maxLength(50)],
      ],
      status: [
        this.feesType.status || 'Active',
        [Validators.required, Validators.maxLength(50)],
      ],
      createdBy: [this.feesType.createdBy, [Validators.maxLength(100)]],
      createdDate: [
        formatDate(this.feesType.createdDate, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
      lastUpdated: [
        formatDate(this.feesType.lastUpdated, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data
  submit(): void {
    if (this.feesTypeForm.valid) {
      const formData = this.feesTypeForm.getRawValue();
      if (this.action === 'edit') {
        this.feesTypeService.updateFeesType(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.feesTypeService.addFeesType(formData).subscribe({
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

  // Confirm and add or update feesType
  public confirmAdd(): void {
    this.submit();
  }
}
