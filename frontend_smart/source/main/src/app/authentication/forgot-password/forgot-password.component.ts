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
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
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
export class ForgotPasswordComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  authForm!: UntypedFormGroup;
  submitted = false;
  returnUrl!: string;
  loading = false;
  
  ngOnInit() {
    this.authForm = this.formBuilder.group({
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
    });
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
  
  get f() {
    return this.authForm.controls;
  }
  
  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.authForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.authService.forgotPassword(this.f['email'].value).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('If the email exists, a reset link has been sent', 'Close', {
          duration: 5000,
        });
      },
      error: () => {
        this.loading = false;
        // Always show generic message
        this.snackBar.open('If the email exists, a reset link has been sent', 'Close', {
          duration: 5000,
        });
      }
    });
  }
}
