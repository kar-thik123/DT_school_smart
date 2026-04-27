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
import { formatDate } from '@angular/common';
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
    MatDatepickerModule,
    MatDialogClose,
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
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Assignment: ${this.data.assignment.title}`;
      this.assignment = this.data.assignment;
    } else {
      this.dialogTitle = 'New Assignment';
      this.assignment = {} as Assignment;
    }
    this.assignmentForm = this.createAssignmentForm();
  }

  createAssignmentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.assignment.id],
      class: [this.assignment.class, [Validators.required]],
      subject: [this.assignment.subject, [Validators.required]],
      title: [this.assignment.title, [Validators.required]],
      assignedDate: [this.assignment.assignedDate, [Validators.required]],
      dueDate: [this.assignment.dueDate, [Validators.required]],
      status: [this.assignment.status || 'Active', [Validators.required]],
      submissions: [this.assignment.submissions || 0],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.assignmentForm.valid) {
      const formData = this.assignmentForm.getRawValue();
      formData.assignedDate = formatDate(this.assignmentForm.value.assignedDate, 'yyyy-MM-dd', 'en-US');
      formData.dueDate = formatDate(this.assignmentForm.value.dueDate, 'yyyy-MM-dd', 'en-US');

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
}
