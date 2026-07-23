import { Component, OnInit, OnDestroy, AfterViewInit, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../organization.service';
import { ProvisioningPayload, ReadinessStatus } from '../organization.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';
import { GlobalLoaderService } from '../../core/service/global-loader.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule,
    BreadcrumbComponent
  ],
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loaderService = inject(GlobalLoaderService);

  @ViewChild('stepper') stepper!: MatStepper;

  provisioningForm!: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  isValidating = false;
  isProvisioned = false;
  isEditMode = false;
  editOrgId: string | null = null;
  editOrgDetails: any = null;
  
  logoPreview: string | null = null;
  profilePreview: string | null = null;
  serverUrl = environment.apiUrl.replace('/api', '');
  today = new Date();
  academicYears: string[] = [];

  // Readiness state
  readiness: ReadinessStatus = {
    ready: false,
    subdomainAvailable: true, // Default to true until checked
    adminEmailAvailable: true, // Default to true until checked
    schoolNameAvailable: true,
    errors: []
  };

  provisioningResult: any = null;
  private formSub?: Subscription;

  ngOnInit() {
    this.editOrgId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editOrgId;

    this.initForm();
    this.generateAcademicYears();
    this.logFormState('1. Immediately after initForm()');
    
    if (this.isEditMode) {
      this.loadOrganizationForEdit();
      this.logFormState('3. Immediately after loadOrganizationForEdit() patchValue()');
    } else {
      this.loadDraft();
      this.logFormState('2. Immediately after loadDraft()');
    }
    
    this.setupFormSubscription();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.logFormState('6. After ngAfterViewInit() / first change detection cycle');
    });
  }

  private logFormState(stage: string) {
    if (!this.provisioningForm) return;
    console.log(`\n--- [DEBUG-FORM] ${stage} ---`);
    console.log('Form RawValue:', JSON.stringify(this.provisioningForm.getRawValue(), null, 2));
    
    // Check DOM values
    const phoneInput = document.querySelector('input[formControlName="contact_phone"]') as HTMLInputElement;
    const adminNameInput = document.querySelector('input[formControlName="admin_name"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[formControlName="admin_password"]') as HTMLInputElement;
    
    console.log('DOM contact_phone:', phoneInput ? phoneInput.value : 'Element not found');
    console.log('DOM admin_name:', adminNameInput ? adminNameInput.value : 'Element not found');
    console.log('DOM admin_password:', passwordInput ? passwordInput.value : 'Element not found');
    console.log('-----------------------------------\n');
  }

  ngOnDestroy() {
    if (this.formSub) {
      this.formSub.unsubscribe();
    }
  }

  private setupFormSubscription() {
    if (this.formSub) {
      this.formSub.unsubscribe();
    }
    // Auto-save draft on changes only if not in edit mode
    this.formSub = this.provisioningForm.valueChanges.subscribe((val) => {
      console.log('--- [DEBUG-FORM] 7. After valueChanges event ---', val);
      if (!this.isEditMode) {
        // Debounce or save selectively if needed
      }
      this.checkReadiness();
    });
  }

  loadOrganizationForEdit() {
    if (!this.editOrgId) return;
    this.loaderService.show('Loading details...');
    this.orgService.getOrganizationById(this.editOrgId).subscribe({
      next: (org) => {
        this.loaderService.hide();
        this.editOrgDetails = org;

        if (org.status === 'DRAFT') {
           this.orgService.getDraft(this.editOrgId!).subscribe({
              next: (draftResponse) => {
                 this.patchDraftToForm(draftResponse);
              },
              error: () => this.snackBar.open('Failed to load draft details', 'Close', { duration: 3000 })
           });
        } else {
           this.orgForm.patchValue({
             school_name: org.school_name,
             school_type: org.school_type || 'K-12',
             medium: org.medium || 'English',
             contact_email: org.contact_email,
             contact_phone: org.contact_phone,
             address: org.address,
             logo_url: org.logo_url,
             profile_url: org.profile_url
           });
           if (org.logo_url) {
             this.logoPreview = org.logo_url;
           }
           if (org.profile_url) {
             this.profilePreview = org.profile_url;
           }

           this.domainForm.patchValue({
             deployment_model: org.domain_type || 'Platform Domain',
             subdomain: org.subdomain,
             custom_domain: org.custom_domain,
             smtp_host: org.smtp_host,
             smtp_port: org.smtp_port
           });

           this.licenseForm.patchValue({
             licensed_seats: org.login_limit,
             warning_threshold: org.license?.warning_threshold || 80,
             renewal_date: org.license?.renewal_date ? new Date(org.license.renewal_date).toISOString().split('T')[0] : null,
             grace_period_days: org.license?.grace_period_days || 7,
             internal_notes: org.license?.internal_notes || ''
           });

           this.adminForm.patchValue({
             admin_name: org.users?.[0]?.name || 'School Admin',
             admin_email: org.users?.[0]?.email || '',
             admin_password: '', // Kept empty for edit, user can type new password
             initial_academic_year: org.academic_years?.[0]?.name || 'N/A',
             backup_enabled: org.backup_enabled
           });
        }
      },
      error: () => {
        this.loaderService.hide();
        this.snackBar.open('Failed to load organization details', 'Close', { duration: 3000 });
      }
    });
  }

  patchDraftToForm(draftResponse: any) {
     this.provisioningForm.patchValue(draftResponse);
     
     if (draftResponse.organization?.logo_url) {
       this.logoPreview = draftResponse.organization.logo_url;
     }
     if (draftResponse.organization?.profile_url) {
       this.profilePreview = draftResponse.organization.profile_url;
     }
     if (draftResponse.license?.renewal_date) {
       this.licenseForm.patchValue({
         renewal_date: new Date(draftResponse.license.renewal_date).toISOString().split('T')[0]
       });
     }
     
     if (draftResponse.step !== undefined && this.stepper) {
       setTimeout(() => {
         this.stepper.selectedIndex = draftResponse.step;
       });
     }
  }

  saveDraft() {
    if (this.isProvisioned || (this.isEditMode && this.editOrgDetails?.status !== 'DRAFT')) return;
    
    this.loaderService.show('Saving draft...');
    const rawValue = this.provisioningForm.getRawValue();
    const payload = {
      ...rawValue.organization,
      ...rawValue.domain,
      domain_type: rawValue.domain.deployment_model,
      ...rawValue.admin,
      ...rawValue.license,
      step: this.stepper ? this.stepper.selectedIndex : 0
    };

    if (this.isEditMode && this.editOrgDetails?.status === 'DRAFT' && this.editOrgId) {
       this.orgService.updateDraft(this.editOrgId, payload).pipe(finalize(() => this.loaderService.hide())).subscribe({
         next: () => this.snackBar.open('Draft updated successfully', 'Close', { duration: 2000 }),
         error: () => this.snackBar.open('Failed to update draft', 'Close', { duration: 3000 })
       });
    } else {
       this.orgService.saveDraft(payload).pipe(finalize(() => this.loaderService.hide())).subscribe({
         next: (res) => {
            this.snackBar.open('Draft saved successfully', 'Close', { duration: 2000 });
            this.router.navigate(['/organization/setup', res.organization.id]);
         },
         error: () => this.snackBar.open('Failed to save draft', 'Close', { duration: 3000 })
       });
    }
  }

  clearDraft() {
    localStorage.removeItem('provisioning_draft');
  }

  loadDraft() {
    // Kept to clean up old local drafts if any exist, but we no longer load from localStorage
    localStorage.removeItem('provisioning_draft');
  }

  private generateAcademicYears() {
    const currentYear = this.today.getFullYear();
    const startYear = this.today.getMonth() >= 5 ? currentYear : currentYear - 1; // Assuming June start
    for (let i = 0; i < 5; i++) {
      this.academicYears.push(`${startYear + i}-${startYear + i + 1}`);
    }
    if (!this.adminForm.get('initial_academic_year')?.value) {
      this.adminForm.get('initial_academic_year')?.setValue(this.academicYears[0]);
    }
  }

  private initForm() {
    this.provisioningForm = this.fb.group({
      organization: this.fb.group({
        school_name: ['', Validators.required],
        school_type: ['K-12'],
        medium: ['English'],
        contact_email: ['', [Validators.required, Validators.email]],
        contact_phone: ['', [Validators.pattern('^[0-9]+$'), Validators.minLength(10), Validators.maxLength(15)]],
        address: [''],
        logo_url: [''],
        profile_url: ['']
      }),
      domain: this.fb.group({
        deployment_model: ['Platform Domain', Validators.required],
        subdomain: ['', [Validators.pattern('^[a-z0-9-]+$')]],
        custom_domain: [''],
        on_premise_endpoint: [''],
        smtp_host: [''],
        smtp_port: ['']
      }),
      admin: this.fb.group({
        admin_name: ['', Validators.required],
        admin_email: ['', [Validators.required, Validators.email]],
        admin_password: ['', [Validators.required, Validators.minLength(6)]],
        initial_academic_year: ['', Validators.required],
        backup_enabled: [false]
      }),
      license: this.fb.group({
        licensed_seats: [100, [Validators.required, Validators.min(1)]],
        renewal_date: [null],
        grace_period_days: [7, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]*$')]],
        warning_threshold: [80],
        internal_notes: ['']
      })
    });
  }

  /**
   * Complex Launch Readiness Check
   * Replaces simple form.valid to allow 'skipped' optional steps
   */
  get canLaunch(): boolean {
    const orgOk = this.orgForm.valid;
    const adminOk = this.isEditMode ? true : this.adminForm.valid;
    const licenseOk = this.licenseForm.valid;
    
    // Deployment specific validation
    const model = this.domainForm.get('deployment_model')?.value;
    let deploymentOk = false;
    if (model === 'Platform Domain') deploymentOk = true;
    else if (model === 'Subdomain') deploymentOk = !!this.domainForm.get('subdomain')?.value;
    else if (model === 'Custom Domain') deploymentOk = !!this.domainForm.get('custom_domain')?.value;

    // Must have all data, NO known conflicts, and not currently submitting
    const subdomainConflict = this.isEditMode ? false : (model === 'Subdomain') && !this.readiness.subdomainAvailable;
    const adminConflict = this.isEditMode ? false : !this.readiness.adminEmailAvailable;
    const schoolNameConflict = this.isEditMode ? false : !this.readiness.schoolNameAvailable;
    const noConflicts = !subdomainConflict && !adminConflict && !schoolNameConflict;
    
    const ready = orgOk && adminOk && licenseOk && deploymentOk && noConflicts && !this.isSubmitting;
    
    if (!ready && !this.isSubmitting) {
      console.log('[DEBUG] canLaunch Check:', { orgOk, adminOk, licenseOk, deploymentOk, noConflicts, subdomainConflict, adminConflict, schoolNameConflict });
    }

    return ready;
  }

  get orgForm() { return this.provisioningForm.get('organization') as FormGroup; }
  get domainForm() { return this.provisioningForm.get('domain') as FormGroup; }
  get adminForm() { return this.provisioningForm.get('admin') as FormGroup; }
  get licenseForm() { return this.provisioningForm.get('license') as FormGroup; }

  setStep(step: number) {
    this.logFormState(`8. Immediately before navigating to step ${step}`);
    this.currentStep = step;
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.orgService.uploadLogo(file).subscribe({
        next: (res) => {
          this.orgForm.patchValue({ logo_url: res.logoUrl });
          this.logoPreview = res.logoUrl;
          this.snackBar.open('Logo uploaded successfully', 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Logo upload failed', 'Close', { duration: 3000 })
      });
    }
  }

  onProfileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.orgService.uploadSchoolProfile(file).subscribe({
        next: (res) => {
          this.orgForm.patchValue({ profile_url: res.profileUrl });
          this.profilePreview = res.profileUrl;
          this.snackBar.open('Profile uploaded successfully', 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Profile upload failed', 'Close', { duration: 3000 })
      });
    }
  }

  checkReadiness() {
    if (this.isValidating || this.isEditMode) return;
    
    const subdomain = this.domainForm.get('subdomain')?.value;
    const adminEmail = this.adminForm.get('admin_email')?.value;
    const model = this.domainForm.get('deployment_model')?.value;
    const schoolName = this.orgForm.get('school_name')?.value;

    if (subdomain || adminEmail || schoolName) {
      this.isValidating = true;
      this.orgService.validateProvisioning({ subdomain, admin_email: adminEmail, model, school_name: schoolName } as any).subscribe({
        next: (res) => {
          this.readiness = res;
          this.isValidating = false;
        },
        error: () => {
          this.isValidating = false;
        }
      });
    }
  }



  launchProvisioning() {
    if (!this.canLaunch) {
      this.snackBar.open('Please fix errors before launching', 'Close', { duration: 3000 });
      return;
    }

    if (this.isEditMode && this.editOrgDetails?.status !== 'DRAFT') {
      this.loaderService.show('Saving changes... Please wait.');
    } else {
      this.loaderService.show('Provisioning organization... Please wait.');
    }
    this.isSubmitting = true;
    const rawValue = this.provisioningForm.getRawValue();
    
    console.log('--- RUNTIME AUDIT LOGGING ---');
    console.log('this.logoPreview:', this.logoPreview);
    console.log('this.orgForm.value:', this.orgForm.value);
    console.log('this.orgForm.getRawValue():', this.orgForm.getRawValue());
    console.log('rawValue.organization.logo_url:', rawValue.organization.logo_url);
    
    const payload: any = {
      ...rawValue.organization,
      ...rawValue.domain,
      domain_type: rawValue.domain.deployment_model,
      ...rawValue.admin,
      ...rawValue.license
    };

    if (this.isEditMode && this.editOrgDetails?.status !== 'DRAFT' && this.editOrgId) {
      const updatePayload = {
        school_name: payload.school_name,
        contact_email: payload.contact_email,
        logo_url: payload.logo_url,
        profile_url: payload.profile_url,
        subdomain: payload.subdomain,
        domain_type: payload.domain_type,
        login_limit: rawValue.license.licensed_seats,
        smtp_host: rawValue.domain.smtp_host,
        smtp_port: rawValue.domain.smtp_port,
        backup_enabled: rawValue.admin.backup_enabled,
        admin_email: rawValue.admin.admin_email,
        admin_password: rawValue.admin.admin_password,
        initial_academic_year: rawValue.admin.initial_academic_year
      };

      this.orgService.updateSettings(this.editOrgId, updatePayload)
        .pipe(finalize(() => {
          this.isSubmitting = false;
          this.loaderService.hide();
        }))
        .subscribe({
        next: () => {
          this.snackBar.open('Tenant Updated Successfully!', 'Success', { duration: 5000 });
          this.router.navigate(['/organization/manage', this.editOrgId]);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Update failed', 'Close', { duration: 5000 });
        }
      });
    } else {
      if (this.isEditMode && this.editOrgDetails?.status === 'DRAFT' && this.editOrgId) {
         payload.draft_id = this.editOrgId;
      }
      this.orgService.provisionOrganization(payload)
        .pipe(finalize(() => {
          this.isSubmitting = false;
          this.loaderService.hide();
        }))
        .subscribe({
        next: (res) => {
          this.provisioningResult = {
            ...res,
            schoolName: payload.school_name,
            subdomain: payload.subdomain,
            adminEmail: payload.admin_email
          };
          this.isProvisioned = true;
          this.clearDraft(); // Clear draft on success — prevents retry with stale data
          this.snackBar.open('Tenant Launched Successfully!', 'Success', { duration: 5000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Launch failed', 'Close', { duration: 5000 });
          this.clearDraft(); // Clear draft on failure — forces clean retry
        }
      });
    }
  }

  resetConsole() {
    this.isProvisioned = false;
    this.clearDraft(); // Clear draft on reset — prevents stale data on next session
    this.initForm();
    this.generateAcademicYears();
    this.setupFormSubscription();
    this.currentStep = 1;
    this.logoPreview = null;
    this.profilePreview = null;
    if (this.stepper) {
      this.stepper.selectedIndex = 0;
    }
  }
}
