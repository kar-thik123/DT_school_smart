import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { DriverService } from '../../drivers.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-drivers-delete',
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
export class DriversDeleteComponent {
  driverService = inject(DriverService);

  constructor(
    public dialogRef: MatDialogRef<DriversDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmDelete(): void {
    this.driverService.deleteDriver(this.data.id).subscribe(() => {
      this.dialogRef.close(1);
    });
  }
}
