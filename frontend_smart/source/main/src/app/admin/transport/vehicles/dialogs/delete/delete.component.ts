import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { VehicleService } from '../../vehicles.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-vehicles-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
  ],
})
export class VehiclesDeleteComponent {
  vehicleService = inject(VehicleService);

  constructor(
    public dialogRef: MatDialogRef<VehiclesDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmDelete(): void {
    this.vehicleService.deleteVehicle(this.data.id).subscribe(() => {
      this.dialogRef.close(1);
    });
  }
}
