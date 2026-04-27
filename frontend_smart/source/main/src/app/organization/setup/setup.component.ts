import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../organization.service';
import { ProvisioningPayload, ReadinessStatus } from '../organization.model';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';

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
    BreadcrumbComponent
  ],
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private snackBar = inject(MatSnackBar);

  provisioningForm!: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  isValidating = false;
  isProvisioned = false;
  
  logoPreview: string | null = null;
  serverUrl = environment.apiUrl.replace('/api', '');

  // Readiness state
  readiness: ReadinessStatus = {
    ready: false,
    subdomainAvailable: true, // Default to true until checked
    adminEmailAvailable: true, // Default to true until checked
    errors: []
  };

  provisioningResult: any = null;

  ngOnInit() {
    this.initForm();
    this.loadDraft();
    
    // Auto-save draft on changes
    this.provisioningForm.valueChanges.subscribe(() => {
      this.saveDraft();
      this.checkReadiness();
    });
  }

  saveDraft() {
    localStorage.setItem('provisioning_draft', JSON.stringify(this.provisioningForm.value));
  }

  loadDraft() {
    const draft = localStorage.getItem('provisioning_draft');
    if (draft) {
      this.provisioningForm.patchValue(JSON.parse(draft));
    }
  }

  private initForm() {
    this.provisioningForm = this.fb.group({
      organization: this.fb.group({
        school_name: ['', Validators.required],
        school_type: ['K-12'],
        medium: ['English'],
        contact_email: ['', [Validators.required, Validators.email]],
        contact_phone: [''],
        address: [''],
        logo_url: ['']
      }),
      domain: this.fb.group({
        deployment_model: ['SaaS', Validators.required],
        subdomain: ['', [Validators.pattern('^[a-z0-9-]+$')]],
        custom_domain: [''],
        on_premise_endpoint: ['']
      }),
      smtp: this.fb.group({
        smtp_host: [''],
        smtp_port: [587],
        smtp_email: ['', Validators.email],
        smtp_password: [''],
        backup_enabled: [false],
        login_limit: [100]
      }),
      admin: this.fb.group({
        admin_name: ['School Admin', Validators.required],
        admin_email: ['', [Validators.required, Validators.email]],
        admin_password: ['', [Validators.required, Validators.minLength(6)]]
      }),
      license: this.fb.group({
        licensed_seats: [100, [Validators.required, Validators.min(1)]],
        renewal_date: [null],
        grace_period_days: [7],
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
    const adminOk = this.adminForm.valid;
    const licenseOk = this.licenseForm.valid;
    
    // Deployment specific validation
    const model = this.domainForm.get('deployment_model')?.value;
    let deploymentOk = false;
    if (model === 'SaaS') deploymentOk = !!this.domainForm.get('subdomain')?.value;
    else if (model === 'Custom') deploymentOk = !!this.domainForm.get('custom_domain')?.value;
    else if (model === 'On-Premise') deploymentOk = true; // Always allow Local/On-Premise launch

    // Must have all data, NO known conflicts, and not currently submitting
    const subdomainConflict = (model === 'SaaS') && !this.readiness.subdomainAvailable;
    const adminConflict = !this.readiness.adminEmailAvailable;
    const noConflicts = !subdomainConflict && !adminConflict;
    
    const ready = orgOk && adminOk && licenseOk && deploymentOk && noConflicts && !this.isSubmitting;
    
    if (!ready && !this.isSubmitting) {
      console.log('[DEBUG] canLaunch Check:', { orgOk, adminOk, licenseOk, deploymentOk, noConflicts, subdomainConflict, adminConflict });
    }

    return ready;
  }

  get orgForm() { return this.provisioningForm.get('organization') as FormGroup; }
  get domainForm() { return this.provisioningForm.get('domain') as FormGroup; }
  get smtpForm() { return this.provisioningForm.get('smtp') as FormGroup; }
  get adminForm() { return this.provisioningForm.get('admin') as FormGroup; }
  get licenseForm() { return this.provisioningForm.get('license') as FormGroup; }

  setStep(step: number) {
    this.currentStep = step;
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.orgService.uploadLogo(file).subscribe({
        next: (res) => {
          this.orgForm.patchValue({ logo_url: res.logoUrl });
          this.logoPreview = `${this.serverUrl}${res.logoUrl}`;
          this.snackBar.open('Logo uploaded successfully', 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Logo upload failed', 'Close', { duration: 3000 })
      });
    }
  }

  checkReadiness() {
    if (this.isValidating) return;
    
    const subdomain = this.domainForm.get('subdomain')?.value;
    const adminEmail = this.adminForm.get('admin_email')?.value;
    const model = this.domainForm.get('deployment_model')?.value;

    if (subdomain || adminEmail) {
      this.isValidating = true;
      this.orgService.validateProvisioning({ subdomain, admin_email: adminEmail, model } as any).subscribe({
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

  testSmtp() {
    if (this.smtpForm.invalid) return;
    this.snackBar.open('Testing SMTP connection...', 'Wait');
    this.orgService.testSmtpConnection(this.smtpForm.value).subscribe({
      next: (res) => {
        this.snackBar.open(res.message, 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'SMTP Connection failed', 'Close', { duration: 5000 });
      }
    });
  }

  launchProvisioning() {
    if (!this.canLaunch) {
      this.snackBar.open('Please fix errors before launching', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const rawValue = this.provisioningForm.value;
    const payload: ProvisioningPayload = {
      ...rawValue.organization,
      ...rawValue.domain,
      ...rawValue.smtp,
      ...rawValue.admin,
      ...rawValue.license
    };

    this.orgService.provisionOrganization(payload).subscribe({
      next: (res) => {
        this.provisioningResult = {
          ...res,
          schoolName: payload.school_name,
          subdomain: payload.subdomain,
          adminEmail: payload.admin_email
        };
        this.isProvisioned = true;
        this.isSubmitting = false;
        localStorage.removeItem('provisioning_draft');
        this.snackBar.open('Tenant Launched Successfully!', 'Success', { duration: 5000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Launch failed', 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }

  resetConsole() {
    this.isProvisioned = false;
    this.provisioningForm.reset();
    this.initForm();
    this.currentStep = 1;
    this.logoPreview = null;
  }
}
