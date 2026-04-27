import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-institute-profile',
  templateUrl: './institute-profile.component.html',
  styleUrls: ['./institute-profile.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class InstituteProfileComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);
  private snackBar = inject(MatSnackBar);

  instituteForm!: UntypedFormGroup;
  breadscrums = [{ title: 'Institute Profile', items: ['Settings'], active: 'Institute Profile' }];

  ngOnInit() {
    this.instituteForm = this.fb.group({
      // General Info
      general: this.fb.group({
        name: ['Sanjivni College of Engineering', [Validators.required]],
        code: ['SCE001', [Validators.required]],
        type: ['Engineering College', [Validators.required]],
        foundingDate: ['1995-08-15'],
        motto: ['Excellence in Technology'],
      }),
      // Contact
      contact: this.fb.group({
        email: ['info@sanjivni.edu', [Validators.required, Validators.email]],
        phone: ['+91 9876543210', [Validators.required]],
        address: ['123 University Road, Tech Park, Mumbai, 400001', [Validators.required]],
        website: ['www.sanjivni.edu'],
      }),
      // Branding (Placeholders)
      branding: this.fb.group({
        logo: [''],
        signature: [''],
      }),
      // Social Links
      social: this.fb.group({
        facebook: ['https://facebook.com/sanjivni'],
        twitter: ['https://twitter.com/sanjivni'],
        linkedin: ['https://linkedin.com/school/sanjivni'],
        instagram: ['https://instagram.com/sanjivni'],
      }),
    });
  }

  saveProfile() {
    if (this.instituteForm.valid) {
      console.log('Profile Saved:', this.instituteForm.value);
      this.snackBar.open('Institute Profile Updated Successfully!', '', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
        panelClass: 'snackbar-success',
      });
    }
  }
}
