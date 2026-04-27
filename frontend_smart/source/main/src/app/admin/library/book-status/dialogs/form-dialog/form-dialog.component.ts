import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { BookStatusService } from '../../book-status.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { BookStatus } from '../../book-status.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { formatDate } from '@angular/common';

export interface DialogData {
  id: number;
  action: string;
  bookStatus: BookStatus;
}

@Component({
    selector: 'app-all-assets-form',
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
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDatepickerModule,
        MatDialogClose,
    ]
})
export class BookStatusFormComponent {
  dialogRef = inject<MatDialogRef<BookStatusFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  bookStatusService = inject(BookStatusService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  bookStatusForm: UntypedFormGroup;
  bookStatus: BookStatus;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit' ? data.bookStatus.bookName : 'New Book Status';
    this.bookStatus =
      this.action === 'edit' ? data.bookStatus : new BookStatus({});

    // Initialize the form
    this.bookStatusForm = this.createContactForm();
  }

  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      bookStatusID: [this.bookStatus.bookStatusID],
      bookID: [this.bookStatus.bookID, [Validators.required]],
      bookName: [this.bookStatus.bookName, [Validators.required]],
      status: [
        this.bookStatus.status || 'Available',
        [Validators.required, Validators.maxLength(50)],
      ],
      dateUpdated: [
        formatDate(this.bookStatus.dateUpdated, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
      lastCheckedOutDate: [
        formatDate(this.bookStatus.lastCheckedOutDate, 'yyyy-MM-dd', 'en'),
      ],
      dueDate: [formatDate(this.bookStatus.dueDate, 'yyyy-MM-dd', 'en')],
      checkedOutBy: [this.bookStatus.checkedOutBy, [Validators.maxLength(100)]],
      reservedBy: [this.bookStatus.reservedBy, [Validators.maxLength(100)]],
      condition: [
        this.bookStatus.condition || 'Good',
        [Validators.maxLength(50)],
      ],
      returnDate: [formatDate(this.bookStatus.returnDate, 'yyyy-MM-dd', 'en')],
      notes: [this.bookStatus.notes, [Validators.maxLength(500)]],
    });
  }

  // Display error messages for form controls
  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  // Handle the form submission
  submit(): void {
    if (this.bookStatusForm.valid) {
      const formData = this.bookStatusForm.getRawValue();
      if (this.action === 'edit') {
        this.bookStatusService.updateBookStatus(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Handle error appropriately
          },
        });
      } else {
        this.bookStatusService.addBookStatus(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Handle error appropriately
          },
        });
      }
    }
  }

  // Close the dialog without saving
  onNoClick(): void {
    this.dialogRef.close();
  }
}
