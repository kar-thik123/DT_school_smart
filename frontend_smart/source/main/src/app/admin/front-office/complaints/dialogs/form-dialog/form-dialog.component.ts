import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ComplaintsService } from '../../complaints.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Complaints } from '../../complaints.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatOptionModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTimepickerModule } from '@angular/material/timepicker';

export interface DialogData {
  id: number;
  action: string;
  complaints: Complaints;
}

@Component({
  selector: 'app-complaints-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatDialogClose,
    MatTimepickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsFormComponent {
  dialogRef = inject<MatDialogRef<ComplaintsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  complaintsService = inject(ComplaintsService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  complaintsForm: UntypedFormGroup;
  complaints: Complaints;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.complaints.complainantName : 'New Complain';
    this.complaints =
      this.action === 'edit' ? data.complaints : new Complaints({});
    this.complaintsForm = this.createStudentForm();
  }

  createStudentForm(): UntypedFormGroup {
    return this.fb.group({
      complaintId: [this.complaints.complaintId, [Validators.required]],
      complaintDate: [this.complaints.complaintDate, [Validators.required]],
      complaintTime: [
        this.complaints.complaintTime
          ? this.parseTimeString(this.complaints.complaintTime)
          : null,
        [Validators.required],
      ],
      complainantName: [this.complaints.complainantName, [Validators.required]],
      img: [this.complaints.img],
      complainantType: [this.complaints.complainantType, [Validators.required]],
      studentName: [this.complaints.studentName],
      complaintDescription: [
        this.complaints.complaintDescription,
        [Validators.required],
      ],
      department: [this.complaints.department, [Validators.required]],
      status: [this.complaints.status, [Validators.required]],
      assignedTo: [this.complaints.assignedTo],
      resolutionDescription: [this.complaints.resolutionDescription],
      resolutionDate: [this.complaints.resolutionDate],
      createdAt: [this.complaints.createdAt],
      updatedAt: [this.complaints.updatedAt],
      priorityLevel: [this.complaints.priorityLevel, [Validators.required]],
      feedback: [this.complaints.feedback],
    });
  }

  private parseTimeString(timeString: string): Date | null {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0); // Set hours and minutes
    return date;
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('email')) {
      return 'Please enter a valid email';
    } else if (control.hasError('pattern')) {
      return 'Invalid mobile number';
    }
    return '';
  }

  submit() {
    if (this.complaintsForm.valid) {
      const formData = this.complaintsForm.getRawValue();

      // Handle time formatting if necessary
      if (formData.complaintTime instanceof Date) {
        formData.complaintTime = this.formatTime(formData.complaintTime);
      }

      if (this.action === 'edit') {
        this.complaintsService.updateComplaint(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.complaintsService.addComplaint(formData).subscribe({
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

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onNoClick(): void {
    this.complaintsForm.reset(); // Reset the form
    this.dialogRef.close();
  }
}
