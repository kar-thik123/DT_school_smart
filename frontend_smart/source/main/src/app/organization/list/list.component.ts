import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../organization.service';
import { AuthService } from '@core/service/auth.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
export class ListComponent implements OnInit, OnDestroy {
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  organizations: any[] = [];
  displayedColumns: string[] = ['sno', 'logo', 'name', 'domain', 'superAdmin', 'users', 'status', 'actions'];
  loadingRows: Set<string> = new Set();
  serverUrl = environment.apiUrl.replace('/api', '');
  
  // Pagination, Search & Sort
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  searchTerm = '';
  sortBy = 'created_at';
  sortOrder = 'desc';
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchTerm = val;
      this.pageIndex = 0;
      this.loadOrganizations();
    });
    this.loadOrganizations();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  loadOrganizations() {
    this.orgService.getOrganizations(this.pageIndex + 1, this.pageSize, this.searchTerm, this.sortBy, this.sortOrder).subscribe({
      next: (res: any) => {
        this.organizations = res.data || [];
        this.totalItems = res.meta?.total || 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ORG LIST ERROR]', err);
        this.snackBar.open('Failed to load organizations', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  onSortChange(sort: Sort) {
    // Map Angular Material column names to match DB fields if necessary
    let activeField = sort.active;
    if (activeField === 'name') activeField = 'school_name';
    if (activeField === 'domain') activeField = 'subdomain';
    if (activeField === 'users') activeField = 'users_count';
    if (activeField === 'superAdmin') activeField = 'super_admin';
    
    this.sortBy = activeField;
    this.sortOrder = sort.direction ? (sort.direction as string) : 'desc';
    this.pageIndex = 0;
    this.loadOrganizations();
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrganizations();
  }

  getLogoUrl(logoUrl: string | null): string {
    if (!logoUrl) return 'assets/images/logo.png';
    if (logoUrl.startsWith('http')) return logoUrl;
    
    // ensure no double slashes
    const baseUrl = this.serverUrl.endsWith('/') ? this.serverUrl.slice(0, -1) : this.serverUrl;
    const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    return `${baseUrl}${path}`;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/logo.png';
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
        
        const deleteRequest = row.status === 'DRAFT' 
          ? this.orgService.deleteDraft(row.id) 
          : this.orgService.deleteOrganization(row.id);
          
        deleteRequest.subscribe({
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
