import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-units-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatPaginatorModule],
  templateUrl: './units-preview.component.html',
  styleUrl: './units-preview.component.scss',
})
export class UnitsPreviewComponent {
  // Helper to check if a string starts with a non-alphanumeric character
  startsWithSpecialChar(value: string | undefined): boolean {
    if (!value) return false;
    return /^[^\p{L}\p{N}]/u.test(value);
  }

  // Stores the raw input
  private _previewData: any[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.previewData.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }

  // Input setter that filters out completely empty rows
  @Input()
  set previewData(value: any[]) {
    this._previewData = (value || []).filter(row => !this.isRowEmpty(row));
    this.resetPagination();
  }
  get previewData(): any[] {
    return this._previewData;
  }

  // Reset page when data changes
  private resetPagination() {
    this.currentPage = 1;
  }

  // Determines if a row has any meaningful data
  private isRowEmpty(row: any): boolean {
    if (!row?.raw_data) return true;
    const fields = [
      'Grade', 'Section', 'Subject', 'Unit Name', 'Topic Name', 'Sub Topic Name'
    ];
    return fields.every(f => {
      const val = row.raw_data[f];
      return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });
  }

  @Input() previewSummary: any = {};
  @Output() discard = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();
  @Output() revalidate = new EventEmitter<any[]>();

  get hasErrors(): boolean {
    return this.previewSummary.validation_error > 0;
  }

  onConfirm() {
    const validRecords = this._previewData.filter(row => row.match_status !== 'DUPLICATE');
    const duplicateCount = this._previewData.length - validRecords.length;
    this.confirm.emit({ records: validRecords, duplicateCount });
  }



  startEdit(row: any) {
    row.isEditing = true;
  }

  saveEdit(row: any) {
    row.isEditing = false;
    // Emit revalidate to process the modified records
    const modifiedRecords = this._previewData.map(r => r.raw_data);
    this.revalidate.emit(modifiedRecords);
  }



  // Existing methods ...

  getStatusIcon(status: string): string {
    switch (status) {
      case 'VALID': return 'check_circle';
      case 'DUPLICATE': return 'file_copy';
      case 'NOT_VALID': return 'error';
      case 'EDITED': return 'edit';
      default: return 'help';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'VALID': return 'Valid';
      case 'DUPLICATE': return 'Duplicate';
      case 'NOT_VALID': return 'Validation Error';
      case 'EDITED': return 'Edited (Pending)';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'VALID': return 'status-exact';
      case 'DUPLICATE': return 'status-closest';
      case 'NOT_VALID': return 'status-error';
      case 'EDITED': return 'bg-info text-white px-2 py-1 rounded';
      default: return '';
    }
  }

  getRowClass(status: string): string {
    switch (status) {
      case 'NOT_VALID': return 'row-error';
      case 'DUPLICATE': return 'row-closest';
      case 'EDITED': return ''; // no special background
      default: return '';
    }
  }

  getFieldError(row: any, keywords: string[]): string | null {
    if (row.match_status !== 'NOT_VALID' || !row.resolved_data?.errors) return null;
    for (const err of row.resolved_data.errors) {
      for (const kw of keywords) {
        if (err.toLowerCase().includes(kw.toLowerCase())) {
          return err;
        }
      }
    }
    return null;
  }

  // Returns error message if the specified field starts with a special character
  getSpecialCharError(row: any, field: string): string | null {
    const value = row?.raw_data?.[field];
    if (this.startsWithSpecialChar(value)) {
      return 'Value must not start with a special character';
    }
    return null;
  }
}
