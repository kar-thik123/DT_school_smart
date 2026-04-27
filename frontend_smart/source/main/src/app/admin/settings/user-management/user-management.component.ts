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
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [
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

  displayedColumns: string[] = ['name', 'email', 'role', 'last_login', 'status', 'actions'];
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

  handleEdit(row: IUser) {
    this.openDialog('edit', row);
  }

  handleStatusToggle(row: IUser) {
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
