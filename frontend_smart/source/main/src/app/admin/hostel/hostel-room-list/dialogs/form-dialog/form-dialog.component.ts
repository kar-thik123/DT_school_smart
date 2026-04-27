import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { HostelRoomListService } from '../../hostel-room-list.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { HostelRoomList } from '../../hostel-room-list.model';
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
  hostelRoomList: HostelRoomList;
}

@Component({
    selector: 'app-all-hostel-room-lists-form',
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
export class AllHostelRoomListsFormComponent {
  dialogRef = inject<MatDialogRef<AllHostelRoomListsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  hostelRoomListService = inject(HostelRoomListService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  hostelRoomListForm: UntypedFormGroup;
  hostelRoomList: HostelRoomList;

  constructor() {
    const data = this.data;

    // Set defaults
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? 'Room No:' + data.hostelRoomList.roomNumber
        : 'New Hostel Room';
    this.hostelRoomList =
      this.action === 'edit' ? data.hostelRoomList : new HostelRoomList({});

    // Create the hostelRoomList form
    this.hostelRoomListForm = this.createHostelRoomListForm();
  }

  // Create hostelRoomList form with validators
  createHostelRoomListForm(): UntypedFormGroup {
    return this.fb.group({
      roomId: [this.hostelRoomList.roomId],
      roomNumber: [this.hostelRoomList.roomNumber, [Validators.required]],
      roomType: [this.hostelRoomList.roomType, [Validators.required]],
      floor: [
        this.hostelRoomList.floor,
        [Validators.required, Validators.min(0)],
      ],
      capacity: [
        this.hostelRoomList.capacity,
        [Validators.required, Validators.min(1)],
      ],
      occupiedStatus: [this.hostelRoomList.occupiedStatus || 'Vacant'],
      currentOccupants: [
        this.hostelRoomList.currentOccupants,
        [Validators.required, Validators.min(0)],
      ],
      priceFees: [
        this.hostelRoomList.priceFees,
        [Validators.required, Validators.min(0)],
      ],
      roomCondition: [this.hostelRoomList.roomCondition || 'Good'],
      dateAssigned: [
        this.hostelRoomList.dateAssigned
          ? formatDate(this.hostelRoomList.dateAssigned, 'yyyy-MM-dd', 'en')
          : null,
      ],
      roomSupervisorStaff: [
        this.hostelRoomList.roomSupervisorStaff,
        [Validators.required],
      ],
      hostelBlock: [this.hostelRoomList.hostelBlock, [Validators.required]],
      checkInDate: [
        this.hostelRoomList.checkInDate
          ? formatDate(this.hostelRoomList.checkInDate, 'yyyy-MM-dd', 'en')
          : null,
      ],
      checkOutDate: [
        this.hostelRoomList.checkOutDate
          ? formatDate(this.hostelRoomList.checkOutDate, 'yyyy-MM-dd', 'en')
          : null,
      ],
      roomTypeCode: [this.hostelRoomList.roomTypeCode, [Validators.required]],
      roomDescription: [this.hostelRoomList.roomDescription],
    });
  }

  // Handle error messages for form fields
  getErrorMessage(control: UntypedFormControl): string {
    return control.hasError('required') ? 'Required field' : '';
  }

  // Submit form data
  submit(): void {
    if (this.hostelRoomListForm.valid) {
      const formData = this.hostelRoomListForm.getRawValue();
      if (this.action === 'edit') {
        this.hostelRoomListService.updateHostelRoom(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response); // Close dialog and pass response
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.hostelRoomListService.addHostelRoom(formData).subscribe({
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

  // Confirm and add or update hostelRoomList
  public confirmAdd(): void {
    this.submit();
  }
}
