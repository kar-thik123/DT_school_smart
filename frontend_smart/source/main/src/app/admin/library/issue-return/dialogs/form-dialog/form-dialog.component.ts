import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { IssueReturnService } from '../../issue-return.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IssueReturn } from '../../issue-return.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  issueReturn: IssueReturn;
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
  issueReturnForm: UntypedFormGroup;
  issueReturn: IssueReturn;

  private issueReturnService = inject(IssueReturnService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = data.issueReturn.book_title;
      this.issueReturn = data.issueReturn;
    } else {
      this.dialogTitle = 'New Issue / Return';
      this.issueReturn = new IssueReturn({} as IssueReturn);
    }
    this.issueReturnForm = this.createIssueReturnForm();
  }

  createIssueReturnForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.issueReturn.id],
      book_no: [this.issueReturn.book_no, [Validators.required]],
      book_title: [this.issueReturn.book_title, [Validators.required]],
      student_name: [this.issueReturn.student_name, [Validators.required]],
      roll_no: [this.issueReturn.roll_no, [Validators.required]],
      issue_date: [this.issueReturn.issue_date, [Validators.required]],
      return_date: [this.issueReturn.return_date],
      status: [this.issueReturn.status, [Validators.required]],
    });
  }

  submit() {
    if (this.issueReturnForm.valid) {
      const issueReturnData = this.issueReturnForm.getRawValue();
      if (this.action === 'edit') {
        this.issueReturnService.updateIssueReturn(issueReturnData).subscribe(() => {
          this.dialogRef.close(issueReturnData);
        });
      } else {
        this.issueReturnService.addIssueReturn(issueReturnData).subscribe(() => {
          this.dialogRef.close(issueReturnData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
