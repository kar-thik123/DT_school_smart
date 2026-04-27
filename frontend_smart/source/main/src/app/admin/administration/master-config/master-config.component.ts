import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterConfigService } from './master-config.service';
import { OrganizationProfile, MasterEntity } from './master-config.model';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-master-config',
  templateUrl: './master-config.component.html',
  styleUrls: ['./master-config.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatDividerModule,
    BreadcrumbComponent
  ]
})
export class MasterConfigComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);
  private configService = inject(MasterConfigService);
  private snackBar = inject(MatSnackBar);

  // Profile
  profileForm!: UntypedFormGroup;
  organization?: OrganizationProfile;
  
  // UI State
  isLoading = true;
  isSaving = false;
  
  breadscrums = [
    { title: 'Master Configuration', items: ['Administration'], active: 'Configuration' }
  ];

  // Master Lists
  boards: MasterEntity[] = [];
  mediums: MasterEntity[] = [];
  orgTypes: MasterEntity[] = [];
  academicYears: MasterEntity[] = [];

  ngOnInit() {
    this.initProfileForm();
    this.loadAllData();
  }

  initProfileForm(data?: OrganizationProfile) {
    this.profileForm = this.fb.group({
      school_name: [data?.school_name || '', Validators.required],
      contact_email: [data?.contact_email || '', [Validators.required, Validators.email]],
      contact_phone: [data?.contact_phone || ''],
      address: [data?.address || ''],
      school_type: [data?.school_type || '']
    });
  }

  async loadAllData() {
    this.isLoading = true;
    try {
      this.organization = await lastValueFrom(this.configService.getOrganizationProfile());
      this.initProfileForm(this.organization);
      
      // Load Masters
      [this.boards, this.mediums, this.orgTypes, this.academicYears] = await Promise.all([
        lastValueFrom(this.configService.getEntities('boards')),
        lastValueFrom(this.configService.getEntities('mediums')),
        lastValueFrom(this.configService.getEntities('organization-types')),
        lastValueFrom(this.configService.getEntities('academic-years'))
      ]);

      this.isLoading = false;
    } catch (error: any) {
      this.showNotification('error', 'Failed to load configuration data');
      this.isLoading = false;
    }
  }

  async saveBranding() {
    if (this.profileForm.invalid || !this.organization) return;
    
    this.isSaving = true;
    try {
      await lastValueFrom(this.configService.updateBranding(this.organization.id, this.profileForm.value));
      this.showNotification('success', 'Profile updated successfully');
    } catch (error: any) {
      this.showNotification('error', 'Failed to update profile');
    } finally {
      this.isSaving = false;
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      try {
        const res = await lastValueFrom(this.configService.uploadLogo(file));
        if (this.organization) {
           this.organization.logo_url = res.logoUrl;
           this.showNotification('success', 'Logo uploaded. Save profile to apply.');
        }
      } catch (error: any) {
        this.showNotification('error', 'Logo upload failed');
      }
    }
  }

  // --- Reusable Master CRUD Handlers (for Tab 2) ---
  async addMaster(type: string, name: string) {
    if (!name) return;
    try {
      await lastValueFrom(this.configService.createEntity(type, { name }));
      this.showNotification('success', 'Added successfully');
      this.loadAllData();
    } catch (error: any) {
      this.showNotification('error', 'Failed to add');
    }
  }

  async deleteMaster(type: string, id: string) {
    if (confirm('Are you sure?')) {
      try {
        await lastValueFrom(this.configService.deleteEntity(type, id));
        this.showNotification('success', 'Deleted successfully');
        this.loadAllData();
      } catch (error: any) {
        this.showNotification('error', 'Failed to delete');
      }
    }
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
    });
  }
}
