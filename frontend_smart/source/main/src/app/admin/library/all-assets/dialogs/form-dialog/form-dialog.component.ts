import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AllAssetsService } from '../../all-assets.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AllAssets } from '../../all-assets.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  allAssets: AllAssets;
}

@Component({
    selector: 'app-all-assets-form',
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
    ]
})
export class AllAssetsFormComponent {
  dialogRef = inject<MatDialogRef<AllAssetsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  allAssetsService = inject(AllAssetsService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  libraryForm: UntypedFormGroup;
  allAssets: AllAssets;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.allAssets.title : 'New AllAssets Asset';
    this.allAssets =
      this.action === 'edit' ? data.allAssets : new AllAssets({});

    // Initialize the form
    this.libraryForm = this.createContactForm();
  }

  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.allAssets.id],
      no: [this.allAssets.no, [Validators.required]],
      title: [this.allAssets.title, [Validators.required]],
      subject: [this.allAssets.subject, [Validators.required]],
      purchase_date: [this.allAssets.purchase_date, [Validators.required]],
      department: [this.allAssets.department, [Validators.required]],
      type: [this.allAssets.type, [Validators.required]],
      status: [this.allAssets.status, [Validators.required]],
      last_borrowed: [this.allAssets.last_borrowed],
      borrower_name: [this.allAssets.borrower_name],
      due_date: [this.allAssets.due_date],
      shelf_location: [this.allAssets.shelf_location, [Validators.required]],
    });
  }

  // Display error messages for form controls
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  // Handle the form submission
  submit(): void {
    if (this.libraryForm.valid) {
      const formData = this.libraryForm.getRawValue();
      if (this.action === 'edit') {
        this.allAssetsService.updateAsset(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Handle error appropriately
          },
        });
      } else {
        this.allAssetsService.addAsset(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Handle error appropriately
          },
        });
      }
    }
  }

  // Close the dialog without saving
  onNoClick(): void {
    this.dialogRef.close();
  }
}
