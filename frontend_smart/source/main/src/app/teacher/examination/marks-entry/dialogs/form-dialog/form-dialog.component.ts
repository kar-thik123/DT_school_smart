import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { MarksEntryService } from '../../marks-entry.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MarksEntry } from '../../marks-entry.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  marksEntry: MarksEntry;
}

@Component({
  selector: 'app-marks-entry-form',
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
export class MarksEntryFormComponent {
  dialogRef = inject<MatDialogRef<MarksEntryFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  marksService = inject(MarksEntryService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  marksForm: UntypedFormGroup;
  marksEntry: MarksEntry;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Marks: ${this.data.marksEntry.studentName}`;
      this.marksEntry = this.data.marksEntry;
    } else {
      this.dialogTitle = 'New Marks Entry';
      this.marksEntry = {} as MarksEntry;
    }
    this.marksForm = this.createMarksForm();
  }

  createMarksForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.marksEntry.id],
      rollNo: [this.marksEntry.rollNo, [Validators.required]],
      studentName: [this.marksEntry.studentName, [Validators.required]],
      class: [this.marksEntry.class, [Validators.required]],
      subject: [this.marksEntry.subject, [Validators.required]],
      marksObtained: [this.marksEntry.marksObtained, [Validators.required, Validators.min(0)]],
      maxMarks: [this.marksEntry.maxMarks || 100, [Validators.required, Validators.min(1)]],
      status: [this.marksEntry.status || 'Pending', [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('min')) {
      return 'Minimum value requirement not met';
    }
    return '';
  }

  submit(): void {
    if (this.marksForm.valid) {
      const formData = this.marksForm.getRawValue();
      if (this.action === 'edit') {
        this.marksService.updateMarks(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.marksService.addMarks(formData).subscribe({
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
