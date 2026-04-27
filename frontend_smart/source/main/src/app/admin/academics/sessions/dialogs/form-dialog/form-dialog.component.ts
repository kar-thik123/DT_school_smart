import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SessionsService } from '../../sessions.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Session } from '../../sessions.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  session: Session;
}

@Component({
  selector: 'app-sessions-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatDialogClose,
    MatDatepickerModule,
  ],
})
export class SessionsFormComponent {
  dialogRef = inject<MatDialogRef<SessionsFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  sessionsService = inject(SessionsService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  sessionForm: UntypedFormGroup;
  session: Session;

  constructor() {
    const data = this.data;

    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? data.session.sessionName
        : 'New Session';
    this.session =
      this.action === 'edit'
        ? data.session
        : new Session({} as Session);

    this.sessionForm = this.createSessionForm();
  }

  createSessionForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.session.id],
      sessionName: [this.session.sessionName, [Validators.required]],
      startDate: [this.session.startDate, [Validators.required]],
      endDate: [this.session.endDate, [Validators.required]],
      status: [this.session.status, [Validators.required]],
      instructor: [this.session.instructor, [Validators.required]],
      room: [this.session.room, [Validators.required]],
    });
  }

  getErrorMessage(control: any): string {
    if (control && control.hasError && control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.sessionForm.valid) {
      const formData = this.sessionForm.getRawValue();
      if (this.action === 'edit') {
        this.sessionsService.updateSession(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.sessionsService.addSession(formData).subscribe({
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
    this.dialogRef.close();
  }

  public confirmAdd(): void {
    this.submit();
  }
}
