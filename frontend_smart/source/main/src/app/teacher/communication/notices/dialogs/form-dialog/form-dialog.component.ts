import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { NoticeService } from '../../notice.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { Notice } from '../../notice.model';
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
  notice: Notice;
}

@Component({
  selector: 'app-notice-form',
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
export class NoticeFormComponent {
  dialogRef = inject<MatDialogRef<NoticeFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  noticeService = inject(NoticeService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  noticeForm: UntypedFormGroup;
  notice: Notice;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Notice: ${this.data.notice.title}`;
      this.notice = this.data.notice;
    } else {
      this.dialogTitle = 'New Notice';
      this.notice = {} as Notice;
    }
    this.noticeForm = this.createNoticeForm();
  }

  createNoticeForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.notice.id],
      title: [this.notice.title, [Validators.required]],
      date: [this.notice.date, [Validators.required]],
      category: [this.notice.category || 'Information', [Validators.required]],
      details: [this.notice.details, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.noticeForm.valid) {
      const formData = this.noticeForm.getRawValue();
      formData.date = formatDate(this.noticeForm.value.date, 'yyyy-MM-dd', 'en-US');

      if (this.action === 'edit') {
        this.noticeService.updateNotice(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.noticeService.addNotice(formData).subscribe({
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
