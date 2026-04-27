import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, Inject, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TransportRoute } from '../../routes-page.model';
import { TransportRouteService } from '../../routes-page.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

export interface DialogData {
  id: number;
  action: string;
  route: TransportRoute;
}

@Component({
  selector: 'app-routes-form',
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
export class RoutesFormComponent {
  action: string;
  dialogTitle: string;
  routeForm: UntypedFormGroup;
  route: TransportRoute;
  routeService = inject(TransportRouteService);
  private fb = inject(UntypedFormBuilder);

  constructor(
    public dialogRef: MatDialogRef<RoutesFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if (this.action === 'edit') {
      this.dialogTitle = 'Edit Route';
      this.route = data.route;
    } else {
      this.dialogTitle = 'New Route';
      this.route = new TransportRoute({} as TransportRoute);
    }
    this.routeForm = this.createContactForm();
  }

  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.route.id],
      route_name: [this.route.route_name, [Validators.required]],
      start_point: [this.route.start_point, [Validators.required]],
      end_point: [this.route.end_point, [Validators.required]],
      distance: [this.route.distance, [Validators.required]],
      vehicle_no: [this.route.vehicle_no, [Validators.required]],
      route_fees: [this.route.route_fees, [Validators.required]],
      status: [this.route.status, [Validators.required]],
    });
  }

  submit() {
    if (this.routeForm.valid) {
      if (this.action === 'edit') {
        this.routeService.updateRoute(this.routeForm.getRawValue()).subscribe(() => {
          this.dialogRef.close(1);
        });
      } else {
        this.routeService.addRoute(this.routeForm.getRawValue()).subscribe(() => {
          this.dialogRef.close(1);
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
