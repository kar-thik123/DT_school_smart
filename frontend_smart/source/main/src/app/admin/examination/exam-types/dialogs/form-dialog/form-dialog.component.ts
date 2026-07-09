import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { ExamTypesService } from '../../exam-types.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamType } from '../../exam-types.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  examType: ExamType;
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
  examTypeForm: UntypedFormGroup;
  examType: ExamType;

  private examTypesService = inject(ExamTypesService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = data.examType.exam_name;
      this.examType = data.examType;
    } else {
      this.dialogTitle = 'New Exam Type';
      this.examType = new ExamType({} as ExamType);
    }
    this.examTypeForm = this.createExamTypeForm();
  }

  createExamTypeForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.examType.id],
      exam_name: [this.examType.exam_name, [Validators.required]],
      exam_code: [this.examType.exam_code, [Validators.required]],
      description: [this.examType.description],
      status: [this.examType.status, [Validators.required]],
    });
  }

  submit() {
    if (this.examTypeForm.valid) {
      const reqData = this.examTypeForm.getRawValue();
      if (this.action === 'edit') {
        this.examTypesService.updateExamination(this.examType.id.toString(), reqData).subscribe({
          next: () => {
            this.dialogRef.close(1);
          },
          error: (err) => console.error(err)
        });
      } else {
        this.examTypesService.createExamination(reqData).subscribe({
          next: () => {
            this.dialogRef.close(1);
          },
          error: (err) => console.error(err)
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
