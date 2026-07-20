import { Component, OnInit, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { GlobalLoaderComponent } from '@shared/components/global-loader/global-loader.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/service/auth.service';
import { ImageCompressionService } from '@core/service/image-compression.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { SkillsActionDialogComponent, SkillsActionDialogData } from '../../admin/administration/skills-verify/skills-action-dialog/skills-action-dialog.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    BreadcrumbComponent,
    GlobalLoaderComponent,
    MatTabsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
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

  isLoadingProfile = true;
  userDetails: any = {};
  academicProfiles: { title: string, listItems: string[] }[] = [];
  skills: any[] = [];
  availableSkills: string[] = [
    'Academic Skills',
    'Extra Curricular Skills',
    // 'Athletic Skills',
    // 'Arts & Culture',
    // 'Technical Skills',
    // 'Soft Skills',
    // 'Leadership Skills'
  ];
  selectedSkill: string = 'Academic Skills';
  customSkill: string = '';
  academicYears: any[] = [];
  selectedAcademicYear: string = '';
  editingSkillId: string | null = null;
  editingSkillIndex: number | null = null;
  isSavingSkill = false;
  oldPassword = '';
  newPassword = '';
  selectedProfileImage: File | null = null;
  previewImageUrl: string | null = null;
  
  availableSubjects: any[] = [];
  
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private imageCompressionService = inject(ImageCompressionService);

  private dialog = inject(MatDialog);

  constructor() { }

  ngOnInit(): void {
    this.fetchUserDetails();
    this.fetchUserSkills();
    this.loadActiveAcademicYear();
    this.fetchSubjects();
  }

  fetchSubjects(): void {
    this.http.get<any[]>(`${environment.apiUrl}/users/me/subjects`).subscribe({
      next: (data) => {
        this.availableSubjects = data;
      },
      error: (err) => console.error('Failed to fetch subjects', err)
    });
  }

  loadActiveAcademicYear() {
    this.http.get<any>(`${environment.apiUrl}/academic/active-year`).subscribe({
      next: (data) => {
        if (data && data.id) {
          this.selectedAcademicYear = data.id;
        }
      },
      error: (err) => console.error('Failed to fetch active academic year', err)
    });
  }

  fetchUserSkills(): void {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.id) {
      this.http.get<any[]>(`${environment.apiUrl}/skills/user/${currentUser.id}`).subscribe({
        next: (data) => {
          const uniqueSkills: any[] = [];
          const seen = new Set();
          for (const skill of data) {
            const key = skill.skill_type + '|' + skill.skill_name.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              uniqueSkills.push(skill);
            } else {
              // Auto-cleanup duplicate skill from DB
              this.http.delete(`${environment.apiUrl}/skills/${skill.id}`).subscribe();
            }
          }
          this.skills = uniqueSkills;
        },
        error: (err) => {
          console.error('Failed to fetch user skills:', err);
        }
      });
    }
  }

  fetchUserDetails(): void {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.id) {
      this.http.get<any>(`${environment.apiUrl}/users/profile/${currentUser.id}`).subscribe({
        next: (data) => {
          this.userDetails = data;
          this.isLoadingProfile = false;
          if (!this.userDetails.favorite_subjects) {
            this.userDetails.favorite_subjects = [];
          }
          this.academicProfiles = (data.academic_profiles || []).map((p: any) => ({
            title: p.title || '',
            listItems: Array.isArray(p.listItems) ? p.listItems : (p.list ? [p.list] : [''])
          }));
          // skills removed from UserProfile in DB
        },
        error: (err) => {
          console.error('Failed to fetch user details:', err);
          this.isLoadingProfile = false;
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

  addSelectedSkill() {
    const skillName = this.customSkill.trim();
    const skillType = this.selectedSkill;

    if (!skillName) {
      this.showNotification('snackbar-danger', 'Please enter a skill name.', 'bottom', 'center');
      return;
    }

    if (!skillType) {
      this.showNotification('snackbar-danger', 'Please select a skill type.', 'bottom', 'center');
      return;
    }

    const isDuplicate = this.skills.some(s =>
      s.skill_type === skillType &&
      s.skill_name.toLowerCase() === skillName.toLowerCase() &&
      s.id !== this.editingSkillId
    );

    if (isDuplicate) {
      this.showNotification('snackbar-danger', 'This skill already exists.', 'bottom', 'center');
      return;
    }

    this.isSavingSkill = true;

    // You can format this however you want to store it, for example: "HTML5 (Extra Curricular Skills)"
    // We are now storing skill_type and skill_name directly in DB!
    const formData = new FormData();
    formData.append('skill_type', skillType);
    formData.append('skill_name', skillName);
    if (this.selectedAcademicYear) {
      formData.append('academic_year_id', this.selectedAcademicYear);
    }

    if (this.existingImages && this.existingImages.length > 0) {
      this.existingImages.forEach(img => {
        formData.append('kept_images', img);
      });
    } else {
      formData.append('kept_images', '[]');
    }

    if (this.selectedSkillImages.length > 0) {
      this.selectedSkillImages.forEach(file => {
        formData.append('images', file);
      });
    }

    if (this.editingSkillId !== null) {
      // Update existing skill
      this.http.put<any>(`${environment.apiUrl}/skills/${this.editingSkillId}`, formData).subscribe({
        next: (updatedSkill) => {
          this.isSavingSkill = false;
          const index = this.skills.findIndex(s => s.id === this.editingSkillId);
          if (index !== -1) {
            this.skills[index] = updatedSkill;
          }
          this.cancelEditSkill();
          this.showNotification('snackbar-success', 'Skill updated successfully!', 'bottom', 'center');
        },
        error: (err) => {
          this.isSavingSkill = false;
          console.error('Failed to update skill:', err);
          let errMsg = err.error?.message || err.error?.error || 'Failed to update skill';
          if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
          this.showNotification('snackbar-danger', errMsg, 'bottom', 'center');
        }
      });
    } else {
      // Create new skill
      this.http.post<any>(`${environment.apiUrl}/skills`, formData).subscribe({
        next: (newSkill) => {
          this.isSavingSkill = false;
          this.skills.unshift(newSkill);
          this.selectedSkill = 'Academic Skills';
          this.customSkill = '';
          this.clearSkillImages();
          this.showNotification('snackbar-success', 'Skill added successfully!', 'bottom', 'center');
        },
        error: (err) => {
          this.isSavingSkill = false;
          console.error('Failed to add skill:', err);
          let errMsg = err.error?.message || err.error?.error || 'Failed to add skill';
          if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
          this.showNotification('snackbar-danger', errMsg, 'bottom', 'center');
        }
      });
    }
  }

  get academicSkills() {
    return this.skills.filter(s => s.skill_type === 'Academic Skills');
  }

  get approvedAcademicSkillsCount() {
    return this.academicSkills.filter(s => s.status === 'approved').length;
  }

  get extraCurricularSkills() {
    return this.skills.filter(s => s.skill_type === 'Extra Curricular Skills');
  }

  get approvedExtraCurricularSkillsCount() {
    return this.extraCurricularSkills.filter(s => s.status === 'approved').length;
  }

  existingImages: string[] = [];

  editSkill(skill: any) {
    this.editingSkillId = skill.id;
    this.editingSkillIndex = null; // No longer using index

    if (this.availableSkills.includes(skill.skill_type)) {
      this.selectedSkill = skill.skill_type;
    } else {
      this.selectedSkill = 'Academic Skills';
    }

    this.customSkill = skill.skill_name;
    this.existingImages = skill.images ? [...skill.images] : [];
    this.skillImagePreviews = skill.images ? skill.images.map((img: string) => this.getSkillImageUrl(img)) : [];
    this.selectedSkillImages = []; // We clear the actual file array so if user saves without changes, no files are sent
  }

  cancelEditSkill() {
    this.editingSkillId = null;
    this.editingSkillIndex = null;
    this.selectedSkill = 'Academic Skills';
    this.customSkill = '';
    this.clearSkillImages();
  }

  skillImagePreviews: string[] = [];
  selectedSkillImages: File[] = [];

  async onSkillImageSelected(event: any): Promise<void> {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check for valid image files
    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) {
        this.showNotification('snackbar-danger', 'Please select valid image files only.', 'bottom', 'center');
        event.target.value = '';
        return;
      }
    }

    const skillType = this.selectedSkill; // The limit is based on the selected skill category
    let maxImages = 1; // Default
    if (skillType === 'Academic Skills') {
      maxImages = 2;
    } else if (skillType === 'Extra Curricular Skills') {
      maxImages = 3;
    }

    const currentCount = this.skillImagePreviews.length;
    const remainingSlots = maxImages - currentCount;

    if (remainingSlots <= 0) {
      this.showNotification('snackbar-warning', `Maximum ${maxImages} images allowed for ${skillType || 'this skill'}.`, 'bottom', 'center');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
    if (files.length > remainingSlots) {
      this.showNotification('snackbar-warning', `Only ${remainingSlots} more image(s) can be added.`, 'bottom', 'center');
    }

    for (const file of filesToProcess) {
      const compressedFile = await this.imageCompressionService.compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800
      });
      this.selectedSkillImages.push(compressedFile);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.skillImagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(compressedFile);
    }

    // Clear the input value so the same file can be selected again if removed
    event.target.value = '';
  }

  onSkillTypeChange() {
    const skillType = this.selectedSkill;
    let maxImages = 1; // Default
    if (skillType === 'Academic Skills') {
      maxImages = 2;
    } else if (skillType === 'Extra Curricular Skills') {
      maxImages = 3;
    }

    if (this.skillImagePreviews.length > maxImages) {
      this.selectedSkillImages = this.selectedSkillImages.slice(0, maxImages);
      this.skillImagePreviews = this.skillImagePreviews.slice(0, maxImages);
      this.showNotification('snackbar-warning', `Images trimmed to ${maxImages} due to category change.`, 'bottom', 'center');
    }
  }

  removeSkillImage(index: number) {
    if (index < this.existingImages.length) {
      this.existingImages.splice(index, 1);
    } else {
      this.selectedSkillImages.splice(index - this.existingImages.length, 1);
    }
    this.skillImagePreviews.splice(index, 1);
  }

  clearSkillImages() {
    this.existingImages = [];
    this.selectedSkillImages = [];
    this.skillImagePreviews = [];
  }

  removeSkill(skill: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the skill "${skill.skill_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.apiUrl}/skills/${skill.id}`).subscribe({
          next: () => {
            this.skills = this.skills.filter(s => s.id !== skill.id);
            this.showNotification('snackbar-success', 'Skill deleted successfully!', 'bottom', 'center');
          },
          error: (err) => {
            console.error('Failed to delete skill:', err);
            let errMsg = err.error?.message || err.error?.error || 'Failed to delete skill';
            if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
            this.showNotification('snackbar-danger', errMsg, 'bottom', 'center');
          }
        });
      }
    });
  }

  getUserProfileImage(): string {
    if (this.previewImageUrl) {
      return this.previewImageUrl;
    }
    if (this.userDetails?.profile_image) {
      if (this.userDetails.profile_image.startsWith('http')) {
        return this.userDetails.profile_image;
      }
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}${this.userDetails.profile_image}`;
    }
    return 'assets/images/user/user.jpg';
  }

  getSkillImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Ensure legacy paths or paths missing /api prefix are corrected
    if (imagePath.startsWith('/uploads')) {
      imagePath = `/api${imagePath}`;
    } else if (imagePath.startsWith('uploads')) {
      imagePath = `/api/${imagePath}`;
    }
    
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/user/user3.jpg';
  }

  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.selectedProfileImage = null;
        event.target.value = '';
        this.showNotification('snackbar-danger', 'Please select a valid image file.', 'bottom', 'center');
        return;
      }

      // Compress the selected image before setting it
      const compressedFile = await this.imageCompressionService.compressImage(file, {
        maxSizeMB: 1, // Target max size 1MB for profile picture
        maxWidthOrHeight: 800
      });

      this.selectedProfileImage = compressedFile;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImageUrl = e.target.result;
      };
      reader.readAsDataURL(compressedFile);
    }
  }

  saveChanges(): void {
    const currentUser = this.authService.getUser();

    // Automatically save any pending skill inputs if they clicked Save Changes instead of Add/Update
    if (this.selectedSkill && this.customSkill.trim()) {
      this.addSelectedSkill();
    }

    if (currentUser && currentUser.id) {
      this.userDetails.academic_profiles = this.academicProfiles;

      const formData = new FormData();
      formData.append('name', this.userDetails.name || '');
      formData.append('email', this.userDetails.email || '');
      formData.append('phone', this.userDetails.phone || '');
      formData.append('city', this.userDetails.city || '');
      formData.append('country', this.userDetails.country || '');
      formData.append('address', this.userDetails.address || '');
      formData.append('about', this.userDetails.about || '');
      formData.append('favorite_colour', this.userDetails.favorite_colour || '');
      formData.append('favorite_subjects', JSON.stringify(this.userDetails.favorite_subjects || []));
      formData.append('roll_number', this.userDetails.roll_number || '');
      if (this.userDetails.date_of_birth) {
        formData.append('date_of_birth', new Date(this.userDetails.date_of_birth).toISOString());
      }
      if (this.userDetails.academic_birth) {
        formData.append('academic_birth', new Date(this.userDetails.academic_birth).toISOString());
      }
      formData.append('academic_profiles', JSON.stringify(this.academicProfiles));

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
          let errMsg = err.error?.message || err.error?.error || 'Failed to update profile.';
          if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
          this.showNotification('snackbar-danger', errMsg, 'bottom', 'center');
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
        let errMsg = err.error?.message || err.error?.error || 'Failed to change password';
        if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
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

  viewImage(imageUrl: string): void {
    this.dialog.open(SkillsActionDialogComponent, {
      data: { type: 'image', imageUrl: imageUrl } as SkillsActionDialogData,
      panelClass: 'image-preview-dialog',
      backdropClass: 'image-preview-backdrop',
      width: 'auto',
      height: 'auto',
      maxWidth: '95vw',
      maxHeight: '95vh'
    });
  }
}
