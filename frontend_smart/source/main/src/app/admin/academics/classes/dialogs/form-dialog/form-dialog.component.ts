import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { ClassesService } from '../../classes.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Classes } from '../../classes.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  classes: Classes;
}

@Component({
  selector: 'app-classes-form',
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
export class ClassesFormComponent {
  dialogRef = inject<MatDialogRef<ClassesFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  classesService = inject(ClassesService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  classesForm: UntypedFormGroup;
  classes: Classes;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.classes.className
        : 'New Class';
    this.classes =
      this.action === 'edit'
        ? data.classes
        : new Classes({} as Classes);

    this.classesForm = this.createClassesForm();
  }

  createClassesForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.classes.id],
      className: [this.classes.className, [Validators.required]],
      section: [this.classes.section, [Validators.required]],
      academicYear: [this.classes.academicYear, [Validators.required]],
      teacher: [this.classes.teacher, [Validators.required]],
      status: [this.classes.status, [Validators.required]],
      studentCount: [this.classes.studentCount, [Validators.required]],
      roomNumber: [this.classes.roomNumber, [Validators.required]],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.classesForm.valid) {
      const formData = this.classesForm.getRawValue();
      if (this.action === 'edit') {
        this.classesService.updateClass(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.classesService.addClass(formData).subscribe({
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
