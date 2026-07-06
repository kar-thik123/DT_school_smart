import { GlobalLoaderComponent } from '@shared/components/global-loader/global-loader.component';
import { Component, OnDestroy, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserManagementFormComponent } from './dialogs/form-dialog/form-dialog.component';
import { UserManagementDeleteComponent } from './dialogs/delete/delete.component';
import { UserManagementService } from './user-management.service';
import { IUser } from './user-management.model';
import { rowsAnimation } from '@shared';
import { Direction } from '@angular/cdk/bidi';
import { LocalStorageService } from '@shared/services';
import { AuthService } from '@core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { UserImportDialogComponent } from './dialogs/import-dialog/import-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [GlobalLoaderComponent, 
    BreadcrumbComponent, 
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatRippleModule
  ],
})
export class UserManagementComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  userManagementService = inject(UserManagementService);
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);
  authService = inject(AuthService);

  // ID of the currently logged-in user — used for self-protection checks
  readonly currentUserId: string = this.authService.currentUserValue?.id;

  displayedColumns: string[] = ['name', 'email', 'role', 'roll_number', 'last_login', 'status', 'actions'];
  dataSource = new MatTableDataSource<IUser>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild('filter', { static: true }) filter!: ElementRef;

  breadscrums = [{ title: 'User Management', items: ['Administration'], active: 'Users' }];

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleRefresh() {
    if (this.filter && this.filter.nativeElement) {
      this.filter.nativeElement.value = '';
    }
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.userManagementService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoading = false;
        },
        error: (err: any) => {
          this.showNotification('snackbar-danger', err.message || 'Failed to load users', 'bottom', 'center');
          this.isLoading = false;
        },
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async handleAdd() {
    this.isLoading = true;
    this.userManagementService.getLicenseInfo().subscribe({
      next: (license) => {
        this.isLoading = false;
        if (license.usagePercent >= 100) {
          this.showNotification('snackbar-danger', 'License Limit Reached! Cannot add more users.', 'bottom', 'center');
          return;
        }
        if (license.usagePercent >= license.warning_threshold) {
          this.showNotification('snackbar-warning', `Nearing license limit (${license.activeUsers}/${license.limit})`, 'bottom', 'center');
        }
        this.openDialog('add');
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showNotification('snackbar-danger', 'Failed to verify license seats', 'bottom', 'center');
      }
    });
  }

  handleExportUsers() {
    this.downloadFile(`${environment.apiUrl}/users/export`, 'users_export.csv');
  }

  private downloadFile(url: string, filename: string) {
    let token = this.localStorageService.get('token') as string;
    if (!token) {
      token = sessionStorage.getItem('token') as string;
    }
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const windowUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = windowUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(windowUrl);
    })
    .catch(error => {
      this.showNotification('snackbar-danger', 'Download failed', 'bottom', 'center');
    });
  }

  handleFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.openImportDialog(file);
    }
    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
  }

  openImportDialog(initialFile?: File) {
    let currentJobId: string | null = null;
    const dialogRef = this.dialog.open(UserImportDialogComponent, {
      width: '95vw',
      maxWidth: '1400px',
      height: '85vh',
      data: {
        initialFile: initialFile,
        onAnalyze: (file: File) => {
          this.userManagementService.analyzeBulkImport(file).subscribe({
            next: (res: any) => {
              currentJobId = res.jobId;
              // Pass the metadata and preview back to the dialog
              dialogRef.componentInstance.setPreviewData(res.preview, res.totalRows, res.validRowsCount, res.invalidRowsCount);
            },
            error: (err) => {
              dialogRef.componentInstance.data.isLoading = false;
              this.showNotification('snackbar-danger', err.message || 'Failed to analyze file', 'bottom', 'center');
            }
          });
        },
        onCommit: (validRows: any[]) => {
          // Send jobId instead of the preview rows
          this.userManagementService.commitBulkImport({ jobId: currentJobId }).subscribe({
            next: (res) => {
              dialogRef.close();
              this.showNotification('snackbar-success', res.message || 'Import successful', 'bottom', 'center');
              this.loadData();
            },
            error: (err) => {
              dialogRef.componentInstance.data.isLoading = false;
              this.showNotification('snackbar-danger', err.message || 'Failed to commit import', 'bottom', 'center');
            }
          });
        }
      }
    });
  }

  handleEdit(row: IUser) {
    this.openDialog('edit', row);
  }

  /**
   * Returns true when the row is the currently-logged-in SUPER_ADMIN.
   * Used to hide destructive actions that would orphan the tenant.
   */
  isSuperAdminSelf(row: IUser): boolean {
    return row.role === 'SUPER_ADMIN' && row.id === this.currentUserId;
  }

  handleStatusToggle(row: IUser) {
    if (this.isSuperAdminSelf(row)) {
      this.showNotification('snackbar-danger', 'Tenant owner account cannot be deactivated.', 'bottom', 'center');
      return;
    }
    const newStatus = !row.is_active;
    this.userManagementService.updateUserStatus(row.id, newStatus).subscribe({
      next: () => {
        row.is_active = newStatus;
        row.status = newStatus ? 'Active' : 'Inactive';
        this.showNotification('snackbar-success', `User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'bottom', 'center');
      },
      error: (err: any) => this.showNotification('snackbar-danger', err.message, 'bottom', 'center')
    });
  }

  handleResetPassword(row: IUser) {
    if (this.isSuperAdminSelf(row)) {
      this.showNotification('snackbar-danger', 'Use Forgot Password to reset your own credentials.', 'bottom', 'center');
      return;
    }
    this.userManagementService.sendResetPasswordLink(row.id).subscribe({
      next: () => this.showNotification('snackbar-success', 'Password reset link sent to user email', 'bottom', 'center'),
      error: (err: any) => this.showNotification('snackbar-danger', err.message, 'bottom', 'center')
    });
  }

  openDialog(action: 'add' | 'edit', data?: IUser) {
    const varDirection: Direction = this.localStorageService.get('isRtl') === 'true' ? 'rtl' : 'ltr';
    const dialogRef = this.dialog.open(UserManagementFormComponent, {
      width: '60vw',
      maxWidth: '100vw',
      data: { userManagement: data, action },
      direction: varDirection,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
        this.showNotification('snackbar-success', `${action === 'add' ? 'Added' : 'Updated'} User Successfully`, 'bottom', 'center');
      }
    });
  }

  handleDelete(row: IUser) {
    if (this.isSuperAdminSelf(row)) {
      this.showNotification('snackbar-danger', 'Tenant owner account cannot be deleted.', 'bottom', 'center');
      return;
    }
    const dialogRef = this.dialog.open(UserManagementDeleteComponent, { data: row });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
        this.showNotification('snackbar-danger', 'User deleted successfully', 'bottom', 'center');
      }
    });
  }

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', { duration: 3000, verticalPosition: placementFrom, horizontalPosition: placementAlign, panelClass: colorName });
  }
}
