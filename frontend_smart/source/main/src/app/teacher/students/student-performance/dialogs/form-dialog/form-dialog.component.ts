import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentPerformanceService } from '../../student-performance.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { StudentPerformance } from '../../student-performance.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  performance: StudentPerformance;
}

@Component({
  selector: 'app-student-performance-form',
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
  ],
})
export class StudentPerformanceFormComponent {
  dialogRef = inject<MatDialogRef<StudentPerformanceFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  performanceService = inject(StudentPerformanceService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  performanceForm: UntypedFormGroup;
  performance: StudentPerformance;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Performance: ${this.data.performance.name}`;
      this.performance = this.data.performance;
    } else {
      this.dialogTitle = 'New Performance Record';
      this.performance = {} as StudentPerformance;
    }
    this.performanceForm = this.createPerformanceForm();
  }

  createPerformanceForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.performance.id],
      rollNo: [this.performance.rollNo, [Validators.required]],
      name: [this.performance.name, [Validators.required]],
      subject: [this.performance.subject, [Validators.required]],
      internalMarks: [this.performance.internalMarks, [Validators.required, Validators.min(0)]],
      externalMarks: [this.performance.externalMarks, [Validators.required, Validators.min(0)]],
      totalMarks: [{ value: this.performance.totalMarks, disabled: true }],
      grade: [this.performance.grade, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('min')) {
      return 'Value cannot be negative';
    }
    return '';
  }

  submit(): void {
    if (this.performanceForm.valid) {
      const formData = this.performanceForm.getRawValue();
      formData.totalMarks = Number(formData.internalMarks) + Number(formData.externalMarks);
      if (this.action === 'edit') {
        this.performanceService.updatePerformance(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.performanceService.addPerformance(formData).subscribe({
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

  confirmAdd(): void {
    this.submit();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
