import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Complaint } from '../../complaints.model';

@Component({
  selector: 'app-complaints-form',
  templateUrl: './form-dialog.component.html',
  imports: [
    MatDialogContent,
    MatDialogClose,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  standalone: true,
})
export class ComplaintsFormComponent {
  private fb = inject(UntypedFormBuilder);
  public dialogRef = inject(MatDialogRef<ComplaintsFormComponent>);
  public data = inject(MAT_DIALOG_DATA);

  action: string;
  dialogTitle: string;
  complaintForm: UntypedFormGroup;
  complaint: Complaint;

  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = 'Edit Complaint';
      this.complaint = this.data.complaint;
    } else {
      this.dialogTitle = 'Add Complaint';
      this.complaint = {
        id: 0,
        complaintTitle: '',
        complaintType: '',
        date: '',
        description: '',
        status: 'Pending',
      };
    }
    this.complaintForm = this.createContactForm();
  }

  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.complaint.id],
      complaintTitle: [this.complaint.complaintTitle, [Validators.required]],
      complaintType: [this.complaint.complaintType, [Validators.required]],
      date: [this.complaint.date, [Validators.required]],
      description: [this.complaint.description, [Validators.required]],
      status: [this.complaint.status, [Validators.required]],
    });
  }

  submit() {
    if (this.complaintForm.valid) {
      this.dialogRef.close(this.complaintForm.getRawValue());
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
