import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Vehicle } from '../../vehicles.model';
import { VehicleService } from '../../vehicles.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  vehicle: Vehicle;
}

@Component({
  selector: 'app-vehicles-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogClose,
    MatSelectModule
  ],
})
export class VehiclesFormComponent {
  action: string;
  dialogTitle: string;
  vehicleForm: UntypedFormGroup;
  vehicle: Vehicle;
  vehicleService = inject(VehicleService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<VehiclesFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = 'Edit Vehicle';
      this.vehicle = data.vehicle;
    } else {
      this.dialogTitle = 'New Vehicle';
      this.vehicle = new Vehicle({} as Vehicle);
    }
    this.vehicleForm = this.createContactForm();
  }

  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.vehicle.id],
      vehicle_no: [this.vehicle.vehicle_no, [Validators.required]],
      vehicle_model: [this.vehicle.vehicle_model, [Validators.required]],
      year_made: [this.vehicle.year_made, [Validators.required]],
      driver_name: [this.vehicle.driver_name, [Validators.required]],
      driver_license: [this.vehicle.driver_license, [Validators.required]],
      vehicle_type: [this.vehicle.vehicle_type, [Validators.required]],
      status: [this.vehicle.status, [Validators.required]],
      img: [this.vehicle.img],
    });
  }

  submit() {
    if (this.vehicleForm.valid) {
      if (this.action === 'edit') {
        this.vehicleService.updateVehicle(this.vehicleForm.getRawValue()).subscribe(() => {
          this.dialogRef.close(1);
        });
      } else {
        this.vehicleService.addVehicle(this.vehicleForm.getRawValue()).subscribe(() => {
          this.dialogRef.close(1);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
