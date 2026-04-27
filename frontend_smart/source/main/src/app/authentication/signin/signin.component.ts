import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService, Role } from '@core';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { LocalStorageService } from '@shared/services';
@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  imports: [
    RouterLink,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
})
export class SigninComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit
{
  private formBuilder = inject(UntypedFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private localStorageService = inject(LocalStorageService);

  authForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  error = '';
  hide = true;
  rememberMe = false;
  selectedRole = 'admin';
  showDeviceVerification = false;

  ngOnInit() {
    this.authForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  get f() {
    return this.authForm.controls;
  }


  /**
   * Gets browser and device information for device verification
   * @returns A string representing the browser and device info
   */
  getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    const browserInfo = userAgent.match(
      /(firefox|msie|chrome|safari)[\s/]([\d.]+)/i
    );
    const browserName = browserInfo ? browserInfo[1] : 'unknown';
    const browserVersion = browserInfo ? browserInfo[2] : 'unknown';

    // Get OS info
    let osName = 'unknown';
    if (userAgent.indexOf('Win') !== -1) osName = 'Windows';
    else if (userAgent.indexOf('Mac') !== -1) osName = 'MacOS';
    else if (userAgent.indexOf('Linux') !== -1) osName = 'Linux';
    else if (userAgent.indexOf('Android') !== -1) osName = 'Android';
    else if (userAgent.indexOf('iOS') !== -1) osName = 'iOS';

    return `${browserName}-${browserVersion}-${osName}`;
  }
  onSubmit() {
    this.submitted = true;
    this.loading = true;
    this.error = '';

    if (this.authForm.invalid) {
      this.error = 'Email and Password not valid !';
      this.loading = false;
      return;
    }

    this.authService
      .login(
        this.f['email'].value,
        this.f['password'].value
      )
      .subscribe({
        next: (response) => {
          const role = response.user.role;
          this.loading = false;
          this.router.navigate([this.authService.getDefaultRoute(role)]);
        },
        error: (error) => {
          this.error = error;
          this.submitted = false;
          this.loading = false;
        },
      });
  }
}
