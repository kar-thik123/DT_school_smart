import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { TransportRouteService } from '../../routes-page.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-routes-delete',
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
export class RoutesDeleteComponent {
  routeService = inject(TransportRouteService);

  constructor(
    public dialogRef: MatDialogRef<RoutesDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmDelete(): void {
    this.routeService.deleteRoute(this.data.id).subscribe(() => {
      this.dialogRef.close(1);
    });
  }
}
