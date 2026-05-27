import { Component, OnInit, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/service/auth.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatTabsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    FormsModule
  ]
})
export class ProfileComponent implements OnInit {
  breadscrums = [
    {
      title: 'Profile',
      items: ['Extra'],
      active: 'Profile',
    },
  ];

  userDetails: any = {};
  academicProfiles: { title: string, listItems: string[] }[] = [];
  skills: { name: string, level: string }[] = [];
  oldPassword = '';
  newPassword = '';
  selectedProfileImage: File | null = null;
  previewImageUrl: string | null = null;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  constructor() { }

  ngOnInit(): void {
    this.fetchUserDetails();
  }

  fetchUserDetails(): void {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.id) {
      this.http.get<any>(`${environment.apiUrl}/users/profile/${currentUser.id}`).subscribe({
        next: (data) => {
          this.userDetails = data;
          this.academicProfiles = (data.academic_profiles || []).map((p: any) => ({
            title: p.title || '',
            listItems: Array.isArray(p.listItems) ? p.listItems : (p.list ? [p.list] : [''])
          }));
          this.skills = data.skills || [];
        },
        error: (err) => {
          console.error('Failed to fetch user details:', err);
        }
      });
    }
  }


  addProfileBlock() {
    this.academicProfiles.push({ title: '', listItems: [''] });
  }

  removeProfileBlock(index: number) {
    this.academicProfiles.splice(index, 1);
  }

  addListItem(profileIndex: number) {
    this.academicProfiles[profileIndex].listItems.push('');
  }

  removeListItem(profileIndex: number, itemIndex: number) {
    this.academicProfiles[profileIndex].listItems.splice(itemIndex, 1);
  }

  customTrackBy(index: number, obj: any): any {
    return index;
  }

  addSkill() {
    this.skills.push({ name: '', level: '' });
  }

  removeSkill(index: number) {
    this.skills.splice(index, 1);
  }

  getUserProfileImage(): string {
    if (this.previewImageUrl) {
      return this.previewImageUrl;
    }
    if (this.userDetails?.profile_image) {
      // Assuming environment.apiUrl is something like 'http://localhost:3000/api'
      const baseUrl = environment.apiUrl.replace('/api', '');
      return baseUrl + this.userDetails.profile_image;
    }
    return 'assets/images/user/user3.jpg';
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/user/user3.jpg';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedProfileImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveChanges(): void {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.id) {
      this.userDetails.academic_profiles = this.academicProfiles;
      this.userDetails.skills = this.skills;

      const formData = new FormData();
      formData.append('name', this.userDetails.name || '');
      formData.append('email', this.userDetails.email || '');
      formData.append('phone', this.userDetails.phone || '');
      formData.append('city', this.userDetails.city || '');
      formData.append('country', this.userDetails.country || '');
      formData.append('address', this.userDetails.address || '');
      formData.append('about', this.userDetails.about || '');
      formData.append('academic_profiles', JSON.stringify(this.academicProfiles));
      formData.append('skills', JSON.stringify(this.skills));

      if (this.selectedProfileImage) {
        formData.append('profile_image', this.selectedProfileImage);
      }

      this.http.put<any>(`${environment.apiUrl}/users/profile/${currentUser.id}`, formData).subscribe({
        next: (res) => {
          console.log('Profile saved successfully', res);
          // Update local profile image if it came back
          if (res.user_profile?.profile_image) {
            this.userDetails.profile_image = res.user_profile.profile_image;
          }
          this.selectedProfileImage = null; // Clear after upload
          this.previewImageUrl = null;
          this.showNotification('snackbar-success', 'Profile updated successfully!', 'bottom', 'center');
        },
        error: (err) => {
          console.error('Failed to save user details:', err);
          this.showNotification('snackbar-danger', 'Failed to update profile.', 'bottom', 'center');
        }
      });
    }
  }

  changePassword(): void {
    if (!this.oldPassword || !this.newPassword) {
      this.showNotification('snackbar-danger', 'Please fill in both password fields', 'bottom', 'center');
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/auth/change-password`, {
      old_password: this.oldPassword,
      new_password: this.newPassword
    }).subscribe({
      next: (res) => {
        this.showNotification('snackbar-success', 'Password changed successfully', 'bottom', 'center');
        this.oldPassword = '';
        this.newPassword = '';
      },
      error: (err) => {
        console.error('Failed to change password:', err);
        const errMsg = err.error?.message || 'Failed to change password';
        this.showNotification('snackbar-danger', errMsg, 'bottom', 'center');
      }
    });
  }

  showNotification(colorName: string, text: string, placementFrom: MatSnackBarVerticalPosition, placementAlign: MatSnackBarHorizontalPosition) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}
