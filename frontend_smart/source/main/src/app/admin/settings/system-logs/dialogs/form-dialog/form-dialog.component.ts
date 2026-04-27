import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { SystemLogService } from '../../system-log.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SystemLog } from '../../system-log.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  systemLog: SystemLog;
}

@Component({
  selector: 'app-system-log-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class SystemLogFormComponent {
  dialogRef = inject<MatDialogRef<SystemLogFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  systemLogService = inject(SystemLogService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  systemLogForm: UntypedFormGroup;
  systemLog: SystemLog;

  severitiesList: string[] = ['Info', 'Warning', 'Error', 'Alert', 'Critical'];
  modulesList: string[] = ['Auth', 'Settings', 'Reports', 'System', 'Registration', 'Finance', 'Security', 'Maintenance', 'Communication', 'Academics', 'Admin'];

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? `Log ID: ${data.systemLog.id}` : 'Manual Log Entry';
    this.systemLog = this.action === 'edit' ? data.systemLog : new SystemLog({} as SystemLog);
    this.systemLogForm = this.createSystemLogForm();
  }

  createSystemLogForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.systemLog.id],
      timestamp: [this.systemLog.timestamp, [Validators.required]],
      user: [this.systemLog.user, [Validators.required]],
      activity: [this.systemLog.activity, [Validators.required]],
      module: [this.systemLog.module, [Validators.required]],
      ipAddress: [this.systemLog.ipAddress, [Validators.required]],
      severity: [this.systemLog.severity, [Validators.required]],
      status: [this.systemLog.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.systemLogForm.valid) {
      const formData = this.systemLogForm.getRawValue();
      if (this.action === 'edit') {
        this.systemLogService.updateLog(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.systemLogService.addLog(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Add Error:', error); },
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
