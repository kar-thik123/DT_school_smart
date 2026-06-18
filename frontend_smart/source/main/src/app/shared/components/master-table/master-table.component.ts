import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { rowsAnimation, TableExportUtil } from '@shared';
import { formatDate, DatePipe, CommonModule, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeatherIconsComponent } from '@shared/components/feather-icons/feather-icons.component';
import { TableShowHideColumnComponent } from '@shared/components/table-show-hide-column/table-show-hide-column.component';

export interface ColumnDefinition {
  def: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'time'
    | 'phone'
    | 'email'
    | 'address'
    | 'check'
    | 'actionBtn'
    | 'status'
    | 'nameWithImage'
    | 'team'
    | 'progress'
    | 'progressBar'
    | 'priority'
    | 'custom'
    | 'file'
    | 'button'
    | 'checkbox';
  visible?: boolean;
  sortable?: boolean;
  tooltip?: boolean;
  statusBadgeMap?: { [key: string]: string }; // For status column: maps status value to badge class
}

@Component({
  selector: 'app-master-table',
  templateUrl: './master-table.component.html',
  styleUrls: ['./master-table.component.scss'],
  animations: [rowsAnimation],
  imports: [
    FeatherIconsComponent,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    MatOptionModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    NgClass,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatMenuModule,
    MatPaginatorModule,
    DatePipe,
    TableShowHideColumnComponent,
  ],
  standalone: true,
})
export class MasterTableComponent implements OnInit, AfterViewInit {
  private snackBar = inject(MatSnackBar);

  // Inputs
  @Input() title: string = 'Table';
  @Input() columnDefinitions: ColumnDefinition[] = [];
  @Input() dataSource!: MatTableDataSource<any>;
  @Input() isLoading: boolean = false;
  @Input() showCheckbox: boolean = true;
  @Input() showAdd: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() showDetails: boolean = false;
  @Input() showRefresh: boolean = true;
  @Input() showExport: boolean = true;
  @Input() showContextMenu: boolean = true;
  @Input() showBulkDelete: boolean = true;
  @Input() exportFileName: string = 'export';
  @Input() enableRowClick: boolean = true;
  @Input() disableRowClickToEdit: boolean = false;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 100];

  // Outputs
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() details = new EventEmitter<any>();
  @Output() refresh = new EventEmitter<void>();
  @Output() bulkDelete = new EventEmitter<any[]>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() statusClick = new EventEmitter<{ row: any; column: ColumnDefinition; event: MouseEvent }>();
  @Output() checkboxChange = new EventEmitter<{ row: any; column: ColumnDefinition; event: any }>();
  @Output() headerCheckboxChange = new EventEmitter<{ column: ColumnDefinition; event: any }>();

  // Component properties
  selection = new SelectionModel<any>(true, []);
  contextMenuPosition = { x: '0px', y: '0px' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('filter') filter!: ElementRef;
  @ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;

  ngOnInit() {
    // Initialize table
    if (this.dataSource) {
      setTimeout(() => {
        this.refreshTable();
      });
    }
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  getDisplayedColumns(): string[] {
    return this.columnDefinitions
      .filter((cd) => cd.visible !== false)
      .map((cd) => cd.def);
  }

  private refreshTable() {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  onAdd() {
    this.add.emit();
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    this.delete.emit(row);
  }

  onDetails(row: any) {
    this.details.emit(row);
  }

  onRefresh() {
    this.refresh.emit();
  }

  onRowClick(row: any) {
    if (this.enableRowClick) {
      this.rowClick.emit(row);
      // Also emit edit event for backward compatibility, unless disabled
      if (!this.disableRowClickToEdit) {
        this.edit.emit(row);
      }
    }
  }

  exportExcel() {
    const visibleColumns = this.columnDefinitions.filter(
      (col) =>
        col.visible !== false &&
        col.type !== 'check' &&
        col.type !== 'actionBtn'
    );

    const exportData = this.dataSource.filteredData.map((row) => {
      const exportRow: any = {};
      visibleColumns.forEach((col) => {
        let value = row[col.def];

        // Format dates
        if (col.type === 'date' && value) {
          value = formatDate(new Date(value), 'yyyy-MM-dd', 'en');
        }

        exportRow[col.label] = value || '';
      });
      return exportRow;
    });

    TableExportUtil.exportToExcel(exportData, this.exportFileName);
  }

  isAllSelected() {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  removeSelectedRows() {
    const selectedRows = this.selection.selected;
    this.bulkDelete.emit(selectedRows);
    this.selection.clear();
  }

  onContextMenu(event: MouseEvent, item: any) {
    if (!this.showContextMenu) return;

    event.preventDefault();
    this.contextMenuPosition = {
      x: `${event.clientX}px`,
      y: `${event.clientY}px`,
    };
    if (this.contextMenu) {
      this.contextMenu.menuData = { item };
      this.contextMenu.menu?.focusFirstItem('mouse');
      this.contextMenu.openMenu();
    }
  }

  onStatusClick(row: any, column: ColumnDefinition, event: MouseEvent) {
    event.stopPropagation();
    this.statusClick.emit({ row, column, event });
  }

  onCheckboxChange(row: any, column: ColumnDefinition, event: any) {
    this.checkboxChange.emit({ row, column, event });
  }

  onHeaderCheckboxChange(column: ColumnDefinition, event: any) {
    this.headerCheckboxChange.emit({ column, event });
  }

  isAllChecked(column: ColumnDefinition): boolean {
    if (!this.dataSource.data || this.dataSource.data.length === 0) return false;
    const selectableRows = this.dataSource.data.filter(row => !row[column.def]);
    if (selectableRows.length === 0) return false; // None are selectable
    return selectableRows.every(row => row['_selected_' + column.def]);
  }

  hasSelectableRows(column: ColumnDefinition): boolean {
    if (!this.dataSource.data || this.dataSource.data.length === 0) return false;
    return this.dataSource.data.some(row => !row[column.def]);
  }

  isSomeChecked(column: ColumnDefinition): boolean {
    if (!this.dataSource.data || this.dataSource.data.length === 0) return false;
    const selectableRows = this.dataSource.data.filter(row => !row[column.def]);
    return selectableRows.some(row => row['_selected_' + column.def]);
  }

  // Helper method to get status badge class with case-insensitive matching
  getStatusBadgeClass(
    statusValue: string,
    statusBadgeMap?: { [key: string]: string }
  ): string | null {
    if (!statusBadgeMap || !statusValue) {
      return null;
    }

    // Try exact match first
    if (statusBadgeMap[statusValue]) {
      return statusBadgeMap[statusValue];
    }

    // Try case-insensitive match
    const lowerStatusValue = statusValue.toLowerCase();
    const matchingKey = Object.keys(statusBadgeMap).find(
      (key) => key.toLowerCase() === lowerStatusValue
    );

    return matchingKey ? statusBadgeMap[matchingKey] : null;
  }

  downloadFile(fileUrl: string, columnName: string) {
    // Show notification
    this.snackBar.open(`${columnName} downloaded successfully!`, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });

    // In a real application, you would implement the actual file download logic here
    // For example:
    // window.open(fileUrl, '_blank');
    // Or use a more sophisticated download approach

    console.log(`Downloading file from: ${fileUrl}`);
  }

  getProgressBarColor(value: number): string {
    if (value < 50) {
      return 'warn';
    } else if (value >= 50 && value <= 70) {
      return 'accent';
    } else {
      return 'primary';
    }
  }
}
