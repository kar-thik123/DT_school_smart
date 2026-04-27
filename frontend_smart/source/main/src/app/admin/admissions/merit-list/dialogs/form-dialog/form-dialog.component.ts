import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { MeritListService } from '../../merit-list.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MeritList } from '../../merit-list.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  meritList: MeritList;
}

@Component({
  selector: 'app-merit-list-form',
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
    MatDialogClose,
  ]
})
export class MeritListFormComponent {
  dialogRef = inject<MatDialogRef<MeritListFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  meritListService = inject(MeritListService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  meritListForm: UntypedFormGroup;
  meritList: MeritList;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.meritList.student_name
        : 'New Merit Entry';
    this.meritList =
      this.action === 'edit'
        ? data.meritList
        : new MeritList({} as MeritList);
    this.meritListForm = this.createMeritListForm();
  }

  createMeritListForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.meritList.id],
      student_name: [this.meritList.student_name, [Validators.required]],
      application_no: [this.meritList.application_no, [Validators.required]],
      category: [this.meritList.category, [Validators.required]],
      entrance_score: [this.meritList.entrance_score, [Validators.required]],
      academic_score: [this.meritList.academic_score, [Validators.required]],
      total_score: [this.meritList.total_score, [Validators.required]],
      rank: [this.meritList.rank, [Validators.required]],
      course: [this.meritList.course, [Validators.required]],
      selection_status: [this.meritList.selection_status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.meritListForm.valid) {
      const formData = this.meritListForm.getRawValue();
      if (this.action === 'edit') {
        this.meritListService.updateMeritList(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.meritListService.addMeritList(formData).subscribe({
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
