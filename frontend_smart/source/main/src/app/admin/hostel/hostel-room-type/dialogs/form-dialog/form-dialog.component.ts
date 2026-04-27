import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HostelRoomTypeService } from '../../hostel-room-type.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { HostelRoomType } from '../../hostel-room-type.model';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  hostelRoomType: HostelRoomType;
}

@Component({
    selector: 'app-all-hostel-room-types-form',
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
        MatInputModule,
        MatDatepickerModule,
        MatDialogClose,
    ]
})
export class AllHostelRoomTypesFormComponent {
  dialogRef = inject<MatDialogRef<AllHostelRoomTypesFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  hostelRoomTypeService = inject(HostelRoomTypeService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  hostelRoomTypeForm: UntypedFormGroup;
  hostelRoomType: HostelRoomType;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.hostelRoomType.roomTypeName
        : 'New Room Type';
    this.hostelRoomType =
      this.action === 'edit' ? data.hostelRoomType : new HostelRoomType({});

    // Create the hostelRoomType form
    this.hostelRoomTypeForm = this.createHostelRoomTypeForm();
  }

  // Create hostelRoomType form with validators
  createHostelRoomTypeForm(): UntypedFormGroup {
    return this.fb.group({
      roomTypeId: [this.hostelRoomType.roomTypeId],
      roomTypeName: [this.hostelRoomType.roomTypeName, [Validators.required]],
      capacity: [
        this.hostelRoomType.capacity,
        [Validators.required, Validators.min(1)],
      ],
      roomCategory: [this.hostelRoomType.roomCategory, [Validators.required]],
      roomDescription: [this.hostelRoomType.roomDescription],
      roomPrice: [
        this.hostelRoomType.roomPrice,
        [Validators.required, Validators.min(0)],
      ],
      roomFacilities: [this.hostelRoomType.roomFacilities],
      roomArea: [
        this.hostelRoomType.roomArea,
        [Validators.required, Validators.min(0)],
      ],
      roomCondition: [this.hostelRoomType.roomCondition || 'Good'],
      roomTypeCode: [this.hostelRoomType.roomTypeCode, [Validators.required]],
      createdAt: [
        formatDate(this.hostelRoomType.createdAt, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
      updatedAt: [
        formatDate(this.hostelRoomType.updatedAt, 'yyyy-MM-dd HH:mm:ss', 'en'),
      ],
      status: [this.hostelRoomType.status || 'Active'],
      maxOccupants: [
        this.hostelRoomType.maxOccupants,
        [Validators.required, Validators.min(1)],
      ],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data
  submit(): void {
    if (this.hostelRoomTypeForm.valid) {
      const formData = this.hostelRoomTypeForm.getRawValue();
      if (this.action === 'edit') {
        this.hostelRoomTypeService.updateHostelRoomType(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.hostelRoomTypeService.addHostelRoomType(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }

  // Close the dialog without submitting
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Confirm and add or update hostelRoomType
  public confirmAdd(): void {
    this.submit();
  }
}
