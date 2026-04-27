import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { MarksEntryService } from '../../marks-entry.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarksEntry } from '../../marks-entry.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  marksEntry: MarksEntry;
}

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogClose,
    MatSelectModule,
  ],
})
export class FormDialogComponent {
  action: string;
  dialogTitle: string;
  marksEntryForm: UntypedFormGroup;
  marksEntry: MarksEntry;

  private marksEntryService = inject(MarksEntryService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Marks: ${data.marksEntry.student_name}`;
      this.marksEntry = data.marksEntry;
    } else {
      this.dialogTitle = 'New Marks Entry';
      this.marksEntry = new MarksEntry({} as MarksEntry);
    }
    this.marksEntryForm = this.createMarksEntryForm();
  }

  createMarksEntryForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.marksEntry.id],
      exam_name: [this.marksEntry.exam_name, [Validators.required]],
      student_name: [this.marksEntry.student_name, [Validators.required]],
      roll_no: [this.marksEntry.roll_no, [Validators.required]],
      subject: [this.marksEntry.subject, [Validators.required]],
      marks_obtained: [this.marksEntry.marks_obtained, [Validators.required, Validators.min(0)]],
      max_marks: [this.marksEntry.max_marks, [Validators.required, Validators.min(1)]],
      status: [this.marksEntry.status, [Validators.required]],
    });
  }

  submit() {
    if (this.marksEntryForm.valid) {
      const marksEntryData = this.marksEntryForm.getRawValue();
      if (this.action === 'edit') {
        this.marksEntryService.updateMarksEntry(marksEntryData).subscribe(() => {
          this.dialogRef.close(marksEntryData);
        });
      } else {
        this.marksEntryService.addMarksEntry(marksEntryData).subscribe(() => {
          this.dialogRef.close(marksEntryData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
