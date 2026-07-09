import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface ImportDialogData {
  initialFile?: File;
  onAnalyze: (file: File) => void;
  onCommit: (validRows: any[]) => void;
  isLoading?: boolean;
}

@Component({
  selector: 'app-user-import-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>Import Users</h2>
    <mat-dialog-content>
      <mat-progress-bar *ngIf="data.isLoading" mode="indeterminate" class="mb-3"></mat-progress-bar>

      <div *ngIf="!previewRows" class="p-2">
        <p>Please upload a CSV file with the following headers:</p>
        <code>Name, Email Address, Mobile Number, Role, Roll Number, Password</code>
        
        <div class="mt-4">
          <input type="file" #fileInput style="display: none" (change)="onFileSelected($event)" accept=".csv" />
          <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="data.isLoading">
            <mat-icon>upload</mat-icon> Select File
          </button>
        </div>
      </div>

      <div *ngIf="previewRows">
        <div class="d-flex justify-content-between mb-3 align-items-center">
          <div><strong>Total:</strong> {{ previewRows.length }}</div>
          <div><strong class="text-success">Valid:</strong> {{ validRows.length }}</div>
          <div><strong class="text-danger">Invalid:</strong> {{ invalidRows.length }}</div>
          <button mat-stroked-button color="warn" *ngIf="invalidRows.length > 0" (click)="downloadErrorReport()">
            <mat-icon>file_download</mat-icon> Download Error Report
          </button>
        </div>

        <p class="text-muted"><small>Showing preview of up to 100 rows.</small></p>

        <div class="table-responsive" style="max-height: 60vh; overflow-y: auto; overflow-x: auto;">
          <table class="table table-sm table-bordered" style="table-layout: auto; white-space: nowrap;">
            <thead class="table-light">
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Roll Number</th>
                <th>Mobile Number</th>
                <th>Password</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of previewRows | slice:0:100">
                <td class="text-center">
                  <mat-icon *ngIf="row.status === 'VALID'" class="text-success" style="font-size: 18px;">check_circle</mat-icon>
                  <mat-icon *ngIf="row.status !== 'VALID'" class="text-danger" style="font-size: 18px;">error</mat-icon>
                </td>
                <td>{{ row.data?.name || row.data?.Name }}</td>
                <td>{{ row.data?.email || row.data?.['Email Address'] || row.data?.Email }}</td>
                <td>{{ row.data?.role_name || row.data?.role || row.data?.Role }}</td>
                <td>{{ row.data?.roll_number || row.data?.['Roll Number'] }}</td>
                <td>{{ row.data?.mobile_number || row.data?.['Mobile Number'] }}</td>
                <td>{{ row.data?.password || row.data?.Password ? '••••••••' : '' }}</td>
                <td class="text-danger"><small>{{ row.errors?.join(', ') }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="data.isLoading">Cancel</button>
      <button mat-raised-button color="primary" 
              *ngIf="previewRows && validRows.length > 0" 
              (click)="confirm()"
              [disabled]="data.isLoading">
        Import ({{ validRows.length }})
      </button>
    </mat-dialog-actions>
  `
})
export class UserImportDialogComponent implements OnInit {
  previewRows: any[] | null = null;
  validRows: any[] = [];
  invalidRows: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<UserImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImportDialogData
  ) {}

  ngOnInit() {
    if (this.data.initialFile) {
      this.data.isLoading = true;
      this.data.onAnalyze(this.data.initialFile);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.data.isLoading = true;
      this.data.onAnalyze(file);
    }
  }

  setPreviewData(rows: any[], totalRows: number, validCount: number, invalidCount: number) {
    this.data.isLoading = false;
    this.previewRows = rows;
    
    // We mock the counts since we don't have the full dataset in the UI
    this.validRows = new Array(validCount);
    this.invalidRows = new Array(invalidCount);
  }

  confirm() {
    this.data.isLoading = true;
    this.data.onCommit(this.validRows);
  }

  downloadErrorReport() {
    this.showNotification('snackbar-info', 'Error report generation from UI is not available for large datasets. Please check the preview.', 'bottom', 'center');
  }

  showNotification(colorName: string, text: string, placementFrom: any, placementAlign: any) {
    // Basic mock if snackbar not injected
    alert(text);
  }
}
