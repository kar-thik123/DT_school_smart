import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SubstitutionRequestService } from '../../substitution-request.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { SubstitutionRequest } from '../../substitution-request.model';
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
  substitutionRequest: SubstitutionRequest;
}

@Component({
  selector: 'app-substitution-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
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
  ],
})
export class SubstitutionFormComponent {
  dialogRef = inject<MatDialogRef<SubstitutionFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  requestService = inject(SubstitutionRequestService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  substitutionForm: UntypedFormGroup;
  substitutionRequest: SubstitutionRequest;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Request: ${this.data.substitutionRequest.subject}`;
      this.substitutionRequest = this.data.substitutionRequest;
    } else {
      this.dialogTitle = 'New Substitution Request';
      this.substitutionRequest = {} as SubstitutionRequest;
    }
    this.substitutionForm = this.createSubstitutionForm();
  }

  createSubstitutionForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.substitutionRequest.id],
      date: [this.substitutionRequest.date, [Validators.required]],
      timeSlot: [this.substitutionRequest.timeSlot, [Validators.required]],
      class: [this.substitutionRequest.class, [Validators.required]],
      subject: [this.substitutionRequest.subject, [Validators.required]],
      reason: [this.substitutionRequest.reason, [Validators.required]],
      status: [this.substitutionRequest.status || 'Pending', [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.substitutionForm.valid) {
      const formData = this.substitutionForm.getRawValue();
      formData.date = formatDate(this.substitutionForm.value.date, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.requestService.updateRequest(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.requestService.addRequest(formData).subscribe({
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
