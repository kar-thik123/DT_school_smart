import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { ReportCardsService } from '../../report-cards.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportCard } from '../../report-cards.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  reportCard: ReportCard;
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
  reportCardForm: UntypedFormGroup;
  reportCard: ReportCard;

  private reportCardsService = inject(ReportCardsService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Report: ${data.reportCard.student_name}`;
      this.reportCard = data.reportCard;
    } else {
      this.dialogTitle = 'New Report Card';
      this.reportCard = new ReportCard({} as ReportCard);
    }
    this.reportCardForm = this.createReportCardForm();
  }

  createReportCardForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.reportCard.id],
      student_name: [this.reportCard.student_name, [Validators.required]],
      roll_no: [this.reportCard.roll_no, [Validators.required]],
      exam_name: [this.reportCard.exam_name, [Validators.required]],
      total_marks: [this.reportCard.total_marks, [Validators.required, Validators.min(0)]],
      percentage: [this.reportCard.percentage, [Validators.required, Validators.min(0), Validators.max(100)]],
      grade: [this.reportCard.grade, [Validators.required]],
      result: [this.reportCard.result, [Validators.required]],
    });
  }

  submit() {
    if (this.reportCardForm.valid) {
      const reportCardData = this.reportCardForm.getRawValue();
      if (this.action === 'edit') {
        this.reportCardsService.updateReportCard(reportCardData).subscribe(() => {
          this.dialogRef.close(reportCardData);
        });
      } else {
        this.reportCardsService.addReportCard(reportCardData).subscribe(() => {
          this.dialogRef.close(reportCardData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
