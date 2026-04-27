import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AcademicYearService } from '../../academic-year.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AcademicYear } from '../../academic-year.model';
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
  academicYear: AcademicYear;
}

@Component({
  selector: 'app-academic-year-form',
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
    MatDialogClose,
    MatDatepickerModule,
  ],
})
export class AcademicYearFormComponent {
  dialogRef = inject<MatDialogRef<AcademicYearFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  academicYearService = inject(AcademicYearService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  academicYearForm: UntypedFormGroup;
  academicYear: AcademicYear;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.academicYear.academicYear
        : 'New Academic Year';
    this.academicYear =
      this.action === 'edit'
        ? data.academicYear
        : new AcademicYear({} as AcademicYear);

    this.academicYearForm = this.createAcademicYearForm();
  }

  createAcademicYearForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.academicYear.id],
      academicYear: [this.academicYear.academicYear, [Validators.required]],
      status: [this.academicYear.status, [Validators.required]],
      startDate: [this.academicYear.startDate, [Validators.required]],
      endDate: [this.academicYear.endDate, [Validators.required]],
      description: [this.academicYear.description],
      department: [this.academicYear.department],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.academicYearForm.valid) {
      const formData = this.academicYearForm.getRawValue();
      if (this.action === 'edit') {
        this.academicYearService.updateAcademicYear(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.academicYearService.addAcademicYear(formData).subscribe({
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
