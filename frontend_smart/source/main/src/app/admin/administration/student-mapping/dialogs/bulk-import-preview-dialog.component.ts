import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-bulk-import-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>Import Student Enrollments</h2>
    <mat-dialog-content>
      <div *ngIf="!previewRows" class="text-center p-4">
        <p>Please upload a CSV file with the following headers:</p>
        <code>student_email, grade_name, section_name, group_name</code>
        <div class="mt-4">
          <input type="file" #fileInput hidden (change)="onFileSelected($event)" accept=".csv" />
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon> Select File
          </button>
        </div>
      </div>

      <div *ngIf="previewRows">
        <div class="d-flex justify-content-between mb-3">
          <div><strong>Total:</strong> {{ previewRows.length }}</div>
          <div><strong class="text-success">Valid:</strong> {{ validRows.length }}</div>
          <div><strong class="text-danger">Invalid:</strong> {{ invalidRows.length }}</div>
        </div>
        
        <div *ngIf="invalidRows.length > 0" class="alert alert-warning d-flex align-items-center mb-3">
          <mat-icon class="me-2">warning</mat-icon>
          <div>
            <strong>{{ invalidRows.length }} rows have validation errors.</strong> 
            They will be skipped during import. Please fix these errors in your source file or proceed with the valid rows only.
          </div>
        </div>

        <div class="table-responsive" style="max-height: 60vh; overflow-y: auto; overflow-x: auto;">
          <table class="table table-sm table-bordered" style="table-layout: auto; white-space: nowrap;">
            <thead class="table-light">
              <tr>
                <th>Status</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of previewRows">
                <td>
                  <mat-icon *ngIf="row.status === 'VALID'" class="text-success" style="font-size: 18px;">check_circle</mat-icon>
                  <mat-icon *ngIf="row.status !== 'VALID'" class="text-danger" style="font-size: 18px;">error</mat-icon>
                </td>
                <td>{{ row.data.student_email }}</td>
                <td>{{ row.data.grade_name }}</td>
                <td>{{ row.data.section_name }}</td>
                <td class="text-danger"><small>{{ row.errors?.join(', ') }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" *ngIf="previewRows && validRows.length > 0" (click)="confirm()">
        Confirm Import ({{ validRows.length }})
      </button>
    </mat-dialog-actions>
  `
})
export class BulkImportPreviewDialogComponent {
  previewRows: any[] | null = null;
  validRows: any[] = [];
  invalidRows: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<BulkImportPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { onFileSelect: (file: File) => void }
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.data.onFileSelect(file);
    }
  }

  setPreviewData(rows: any[]) {
    this.previewRows = rows;
    this.validRows = rows.filter(r => r.status === 'VALID');
    this.invalidRows = rows.filter(r => r.status !== 'VALID');
  }

  confirm() {
    this.dialogRef.close(this.validRows);
  }
}
