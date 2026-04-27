import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ClassListService } from '../../class-list.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ClassList } from '../../class-list.model';
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
  classList: ClassList;
}

@Component({
    selector: 'app-all-class-lists-form',
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
    ]
})
export class AllClassListsFormComponent {
  dialogRef = inject<MatDialogRef<AllClassListsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  classListService = inject(ClassListService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  classListForm: UntypedFormGroup;
  classList: ClassList;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? 'Room No:' + data.classList.roomNumber
        : 'New Hostel Room';
    this.classList =
      this.action === 'edit' ? data.classList : new ClassList({});

    // Create the classList form
    this.classListForm = this.createClassListForm();
  }

  // Create classList form with validators
  createClassListForm(): UntypedFormGroup {
    return this.fb.group({
      classId: [this.classList.classId],
      className: [
        this.classList.className,
        [Validators.required, Validators.maxLength(100)],
      ],
      classCode: [
        this.classList.classCode,
        [Validators.required, Validators.maxLength(50)],
      ],
      teacherId: [this.classList.teacherId],
      startDate: [
        formatDate(this.classList.startDate, 'yyyy-MM-dd', 'en'),
        [Validators.required],
      ],
      endDate: [formatDate(this.classList.endDate, 'yyyy-MM-dd', 'en')],
      roomNumber: [this.classList.roomNumber, [Validators.required]],
      schedule: [this.classList.schedule, [Validators.maxLength(200)]],
      semester: [this.classList.semester],
      classCapacity: [
        this.classList.classCapacity,
        [Validators.required, Validators.max(500)],
      ],
      status: [this.classList.status || 'Active', [Validators.required]],
      description: [this.classList.description, [Validators.maxLength(500)]],
      classType: [this.classList.classType, [Validators.required]],
      createdAt: [
        formatDate(this.classList.createdAt, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
      updatedAt: [
        formatDate(this.classList.updatedAt, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data
  submit(): void {
    if (this.classListForm.valid) {
      const formData = this.classListForm.getRawValue();
      if (this.action === 'edit') {
        this.classListService.updateClass(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.classListService.addClass(formData).subscribe({
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

  // Confirm and add or update classList
  public confirmAdd(): void {
    this.submit();
  }
}
