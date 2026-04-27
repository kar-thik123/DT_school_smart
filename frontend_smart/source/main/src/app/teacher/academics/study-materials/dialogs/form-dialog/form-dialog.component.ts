import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { StudyMaterialService } from '../../study-material.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { StudyMaterial } from '../../study-material.model';
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
  studyMaterial: StudyMaterial;
}

@Component({
  selector: 'app-study-material-form',
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
export class StudyMaterialFormComponent {
  dialogRef = inject<MatDialogRef<StudyMaterialFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  materialService = inject(StudyMaterialService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  materialForm: UntypedFormGroup;
  studyMaterial: StudyMaterial;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Material: ${this.data.studyMaterial.title}`;
      this.studyMaterial = this.data.studyMaterial;
    } else {
      this.dialogTitle = 'New Study Material';
      this.studyMaterial = {} as StudyMaterial;
    }
    this.materialForm = this.createMaterialForm();
  }

  createMaterialForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.studyMaterial.id],
      class: [this.studyMaterial.class, [Validators.required]],
      subject: [this.studyMaterial.subject, [Validators.required]],
      title: [this.studyMaterial.title, [Validators.required]],
      type: [this.studyMaterial.type || 'PDF', [Validators.required]],
      uploadDate: [this.studyMaterial.uploadDate, [Validators.required]],
      fileUrl: [this.studyMaterial.fileUrl, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.materialForm.valid) {
      const formData = this.materialForm.getRawValue();
      formData.uploadDate = formatDate(this.materialForm.value.uploadDate, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.materialService.updateMaterial(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.materialService.addMaterial(formData).subscribe({
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
