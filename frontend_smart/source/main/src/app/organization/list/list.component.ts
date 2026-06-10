import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../organization.service';
import { AuthService } from '@core/service/auth.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule,
    RouterLink,
    BreadcrumbComponent,
    MatSnackBarModule
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  organizations: any[] = [];
  displayedColumns: string[] = ['logo', 'name', 'domain', 'superAdmin', 'users', 'status', 'actions'];
  loadingRows: Set<string> = new Set();
  serverUrl = environment.apiUrl.replace('/api', '');
  
  // Pagination & Search
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  searchTerm = '';

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.orgService.getOrganizations(this.pageIndex + 1, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        this.organizations = res.data || [];
        this.totalItems = res.meta?.total || 0;
      },
      error: (err) => {
        console.error('[ORG LIST ERROR]', err);
        this.snackBar.open('Failed to load organizations', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.pageIndex = 0;
    this.loadOrganizations();
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrganizations();
  }


  toggleStatus(row: any, newStatus: string) {
    Swal.fire({
      title: 'Update Status?',
      text: `Change ${row.school_name} status to ${newStatus}?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Yes, update'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingRows.add(row.id);
        this.orgService.updateStatus(row.id, newStatus).subscribe({
          next: () => {
            this.snackBar.open(`Tenant updated to ${newStatus}`, 'Close', { duration: 3000 });
            this.loadOrganizations();
            this.loadingRows.delete(row.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Update failed', 'Close', { duration: 3000 });
            this.loadingRows.delete(row.id);
          }
        });
      }
    });
  }

  deleteTenant(row: any) {
    if (row.subdomain === 'sys' || row.status === 'ACTIVE') return; // Cannot delete active or core tenants 

    Swal.fire({
      title: 'DANGER ZONE',
      text: `Are you absolutely sure you want to delete ${row.school_name}? All data will be PERMANENTLY lost.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, DELETE it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingRows.add(row.id);
        this.orgService.deleteOrganization(row.id).subscribe({
          next: () => {
            this.snackBar.open('Tenant deleted successfully', 'Close', { duration: 3000 });
            this.loadOrganizations();
            this.loadingRows.delete(row.id);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Deletion failed', 'Close', { duration: 3000 });
            this.loadingRows.delete(row.id);
          }
        });
      }
    });
  }
}
