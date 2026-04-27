import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { BackupRestoreService } from '../../backup-restore.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BackupRestore } from '../../backup-restore.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  backupRestore: BackupRestore;
}

@Component({
  selector: 'app-backup-restore-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class BackupRestoreFormComponent {
  dialogRef = inject<MatDialogRef<BackupRestoreFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  backupRestoreService = inject(BackupRestoreService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  backupRestoreForm: UntypedFormGroup;
  backupRestore: BackupRestore;

  backupTypesList: string[] = ['Full', 'Incremental', 'Manual', 'Snapshot', 'Archival'];
  statusesList: string[] = ['Completed', 'Failed', 'In Progress', 'Scheduled'];

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.backupRestore.backupName : 'New Backup Job';
    this.backupRestore = this.action === 'edit' ? data.backupRestore : new BackupRestore({} as BackupRestore);
    this.backupRestoreForm = this.createBackupRestoreForm();
  }

  createBackupRestoreForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.backupRestore.id],
      backupName: [this.backupRestore.backupName, [Validators.required]],
      backupDate: [this.backupRestore.backupDate, [Validators.required]],
      backupSize: [this.backupRestore.backupSize],
      backupType: [this.backupRestore.backupType, [Validators.required]],
      triggeredBy: [this.backupRestore.triggeredBy, [Validators.required]],
      storageLocation: [this.backupRestore.storageLocation, [Validators.required]],
      status: [this.backupRestore.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.backupRestoreForm.valid) {
      const formData = this.backupRestoreForm.getRawValue();
      if (this.action === 'edit') {
        this.backupRestoreService.updateBackup(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.backupRestoreService.addBackup(formData).subscribe({
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
