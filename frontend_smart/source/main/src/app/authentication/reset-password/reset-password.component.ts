import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '@core';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  imports: [
      FormsModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
      RouterLink,
      MatSnackBarModule
  ]
})
export class ResetPasswordComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  authForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  hide = true;
  token = '';
  error = '';
  
  ngOnInit() {
    this.authForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.error = 'Invalid token missing from URL.';
      }
    });
  }
  
  get f() {
    return this.authForm.controls;
  }
  
  onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.authForm.invalid || !this.token) {
      if (!this.token) this.error = "Token is missing.";
      return;
    }
    
    this.loading = true;
    this.authService.resetPassword(this.token, this.f['newPassword'].value).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Password reset successfully. Please login.', 'Close', {
          duration: 5000,
        });
        this.router.navigate(['/authentication/signin']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to reset password. Token may be invalid or expired.';
      }
    });
  }
}
