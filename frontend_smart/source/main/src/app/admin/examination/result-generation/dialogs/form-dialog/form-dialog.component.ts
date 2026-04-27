import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { ResultGenerationService } from '../../result-generation.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResultGeneration } from '../../result-generation.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  resultGeneration: ResultGeneration;
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
    MatDatepickerModule,
  ],
})
export class FormDialogComponent {
  action: string;
  dialogTitle: string;
  resultGenerationForm: UntypedFormGroup;
  resultGeneration: ResultGeneration;

  private resultGenerationService = inject(ResultGenerationService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Result: ${data.resultGeneration.exam_name}`;
      this.resultGeneration = data.resultGeneration;
    } else {
      this.dialogTitle = 'New Result Generation';
      this.resultGeneration = new ResultGeneration({} as ResultGeneration);
    }
    this.resultGenerationForm = this.createResultGenerationForm();
  }

  createResultGenerationForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.resultGeneration.id],
      exam_name: [this.resultGeneration.exam_name, [Validators.required]],
      course: [this.resultGeneration.course, [Validators.required]],
      semester: [this.resultGeneration.semester, [Validators.required]],
      result_date: [this.resultGeneration.result_date, [Validators.required]],
      status: [this.resultGeneration.status, [Validators.required]],
    });
  }

  submit() {
    if (this.resultGenerationForm.valid) {
      const resultGenerationData = this.resultGenerationForm.getRawValue();
      if (this.action === 'edit') {
        this.resultGenerationService.updateResultGeneration(resultGenerationData).subscribe(() => {
          this.dialogRef.close(resultGenerationData);
        });
      } else {
        this.resultGenerationService.addResultGeneration(resultGenerationData).subscribe(() => {
          this.dialogRef.close(resultGenerationData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
