import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { HallAllocationService } from '../../hall-allocation.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HallAllocation } from '../../hall-allocation.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  hallAllocation: HallAllocation;
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
  hallAllocationForm: UntypedFormGroup;
  hallAllocation: HallAllocation;

  private hallAllocationService = inject(HallAllocationService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Allocation: ${data.hallAllocation.student_name}`;
      this.hallAllocation = data.hallAllocation;
    } else {
      this.dialogTitle = 'New Hall Allocation';
      this.hallAllocation = new HallAllocation({} as HallAllocation);
    }
    this.hallAllocationForm = this.createHallAllocationForm();
  }

  createHallAllocationForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.hallAllocation.id],
      exam_name: [this.hallAllocation.exam_name, [Validators.required]],
      student_name: [this.hallAllocation.student_name, [Validators.required]],
      roll_no: [this.hallAllocation.roll_no, [Validators.required]],
      hall_no: [this.hallAllocation.hall_no, [Validators.required]],
      seat_no: [this.hallAllocation.seat_no, [Validators.required]],
    });
  }

  submit() {
    if (this.hallAllocationForm.valid) {
      const hallAllocationData = this.hallAllocationForm.getRawValue();
      if (this.action === 'edit') {
        this.hallAllocationService.updateHallAllocation(hallAllocationData).subscribe(() => {
          this.dialogRef.close(hallAllocationData);
        });
      } else {
        this.hallAllocationService.addHallAllocation(hallAllocationData).subscribe(() => {
          this.dialogRef.close(hallAllocationData);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
