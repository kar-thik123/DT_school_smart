import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { VisitorsService } from '../../visitors.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Visitors } from '../../visitors.model';
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
  visitors: Visitors;
}

@Component({
  selector: 'app-visitors-form',
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
export class VisitorsFormComponent {
  dialogRef = inject<MatDialogRef<VisitorsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  visitorsService = inject(VisitorsService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  visitorsForm: UntypedFormGroup;
  visitors: Visitors;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.visitors.visitorName : 'New Visitor';
    this.visitors = this.action === 'edit' ? data.visitors : new Visitors({});
    this.visitorsForm = this.createVisitorsForm();
  }

  createVisitorsForm(): UntypedFormGroup {
    return this.fb.group({
      visitorId: [this.visitors.visitorId, [Validators.required]],
      visitorName: [this.visitors.visitorName, [Validators.required]],
      visitDate: [this.visitors.visitDate, [Validators.required]],
      visitTime: [
        this.visitors.visitTime
          ? this.parseTimeString(this.visitors.visitTime)
          : null,
        [Validators.required],
      ],
      purposeOfVisit: [this.visitors.purposeOfVisit, [Validators.required]],
      contactNumber: [this.visitors.contactNumber, [Validators.required]],
      visitorType: [this.visitors.visitorType, [Validators.required]],
      departmentPersonVisited: [
        this.visitors.departmentPersonVisited,
        [Validators.required],
      ],
      checkOutTime: [this.visitors.checkOutTime],
      idProofType: [this.visitors.idProofType],
      idProofNumber: [this.visitors.idProofNumber],
      notes: [this.visitors.notes],
      createdAt: [this.visitors.createdAt],
      updatedAt: [this.visitors.updatedAt],
    });
  }

  // Improved Time Parsing
  private parseTimeString(timeString: string): Date | null {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0); // Set hours and minutes
    return date;
  }

  // Improved time formatting
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
    if (this.visitorsForm.valid) {
      const formData = this.visitorsForm.getRawValue();

      // Handle time formatting if necessary
      if (formData.visitTime instanceof Date) {
        formData.visitTime = this.formatTime(formData.visitTime);
      }

      // Submit the form data based on action type (edit or add)
      if (this.action === 'edit') {
        this.visitorsService.updateVisitor(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.visitorsService.addVisitor(formData).subscribe({
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
    this.visitorsForm.reset(); // Reset the form
    this.dialogRef.close();
  }
}
