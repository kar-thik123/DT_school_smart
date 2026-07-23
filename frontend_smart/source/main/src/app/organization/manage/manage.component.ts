import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from '../organization.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [
    CommonModule, 
    MatTabsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule,
    MatSnackBarModule,
    BreadcrumbComponent
  ],
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orgService = inject(OrganizationService);
  private snackBar = inject(MatSnackBar);

  orgId: string | null = null;
  org: any = null;
  serverUrl = environment.apiUrl.replace('/api', '');

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('id');
    if (this.orgId) {
      this.loadOrganization(this.orgId);
    }
  }

  loadOrganization(id: string) {
    this.orgService.getOrganizationById(id).subscribe(res => {
      this.org = res;
    });
  }

  toggleStatus() {
    if (!this.org) return;
    const newStatus = this.org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    this.orgService.updateStatus(this.org.id, newStatus).subscribe(() => {
      this.snackBar.open(`Organization ${newStatus} successfully`, 'Close', { duration: 3000 });
      this.loadOrganization(this.org.id);
    });
  }

  openEditDialog() {
    console.log('[DEBUG] openEditDialog clicked');
    if (!this.org) {
       console.log('[DEBUG] this.org is falsy. Aborting navigation.');
       return;
    }
    console.log('[DEBUG] Navigating to edit with org ID:', this.org.id);
    this.router.navigate(['/organization/edit', this.org.id]).then(success => {
       console.log('[DEBUG] Router navigation result:', success);
    }).catch(err => {
       console.error('[DEBUG] Router navigation error:', err);
    });
  }
}
