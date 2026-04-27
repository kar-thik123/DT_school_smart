import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudentPromotionService } from '../../student-promotion.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { StudentPromotion } from '../../student-promotion.model';
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
  studentPromotion: StudentPromotion;
}

@Component({
    selector: 'app-student-promotion-form',
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
        MatDialogClose,
    ]
})
export class StudentPromotionFormComponent {
  dialogRef = inject<MatDialogRef<StudentPromotionFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  studentPromotionService = inject(StudentPromotionService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  studentPromotionForm: UntypedFormGroup;
  studentPromotion: StudentPromotion;

  constructor() {
    const data = this.data;

    // Set action and student promotion data
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.studentPromotion.student_name
        : 'New Student Promotion';
    this.studentPromotion =
      this.action === 'edit'
        ? data.studentPromotion
        : new StudentPromotion({} as StudentPromotion);

    // Create form
    this.studentPromotionForm = this.createStudentPromotionForm();
  }

  // Create form group for student promotion fields with validation
  createStudentPromotionForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.studentPromotion.id],
      img: [this.studentPromotion.img],
      student_name: [this.studentPromotion.student_name, [Validators.required]],
      rollNo: [this.studentPromotion.rollNo, [Validators.required]],
      current_class: [this.studentPromotion.current_class, [Validators.required]],
      promoted_class: [this.studentPromotion.promoted_class, [Validators.required]],
      section: [this.studentPromotion.section, [Validators.required]],
      session: [this.studentPromotion.session, [Validators.required]],
      promotion_date: [this.studentPromotion.promotion_date, [Validators.required]],
      total_marks: [this.studentPromotion.total_marks, [Validators.required]],
      obtained_marks: [this.studentPromotion.obtained_marks, [Validators.required]],
      percentage: [this.studentPromotion.percentage],
      result: [this.studentPromotion.result, [Validators.required]],
      status: [this.studentPromotion.status, [Validators.required]],
    });
  }

  // Handle form validation errors for user feedback
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  // Submit form data
  submit(): void {
    if (this.studentPromotionForm.valid) {
      const formData = this.studentPromotionForm.getRawValue();
      if (this.action === 'edit') {
        this.studentPromotionService.updateStudentPromotion(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.studentPromotionService.addStudentPromotion(formData).subscribe({
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

  // Close the dialog without submitting
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Confirm and add the student promotion
  public confirmAdd(): void {
    this.submit();
  }
}
