import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AssignmentService } from '../../assignment.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Assignment } from '../../assignment.model';
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
  assignment: Assignment;
}

@Component({
  selector: 'app-assignment-form',
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
export class AssignmentFormComponent {
  dialogRef = inject<MatDialogRef<AssignmentFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  assignmentService = inject(AssignmentService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  assignmentForm: UntypedFormGroup;
  assignment: Assignment;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? `Edit Assignment`
        : 'New Assignment';
    this.assignment =
      this.action === 'edit'
        ? data.assignment
        : new Assignment({} as Assignment);

    this.assignmentForm = this.createAssignmentForm();
  }

  createAssignmentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.assignment.id],
      className: [this.assignment.className, [Validators.required]],
      subjectName: [this.assignment.subjectName, [Validators.required]],
      teacherName: [this.assignment.teacherName, [Validators.required]],
      assignmentDate: [this.assignment.assignmentDate, [Validators.required]],
      status: [this.assignment.status, [Validators.required]],
      title: [this.assignment.title, [Validators.required]],
      deadline: [this.assignment.deadline, [Validators.required]],
      details: [this.assignment.details],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.assignmentForm.valid) {
      const formData = this.assignmentForm.getRawValue();
      if (this.action === 'edit') {
        this.assignmentService.updateAssignment(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.assignmentService.addAssignment(formData).subscribe({
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
