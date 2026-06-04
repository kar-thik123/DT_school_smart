import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { SkillsActionDialogComponent, SkillsActionDialogData } from '../skills-action-dialog/skills-action-dialog.component';

@Component({
  selector: 'app-student-skills-dialog',
  templateUrl: './student-skills-dialog.component.html',
  styleUrls: ['./student-skills-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatCardModule
  ]
})
export class StudentSkillsDialogComponent {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  student: any;
  allSkills: any[] = [];
  filteredSkills: any[] = [];
  canModify = false;

  displayedColumns: string[] = ['select', 'type', 'skillName', 'proofs', 'remarks', 'status', 'actions'];
  selection = new SelectionModel<any>(true, []);

  statusFilter = 'all';

  constructor(
    public dialogRef: MatDialogRef<StudentSkillsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.student = data.student;
    this.allSkills = data.skills;
    this.canModify = data.canModify;

    if (!this.canModify) {
      this.displayedColumns = ['type', 'skillName', 'proofs', 'remarks', 'status'];
    }

    this.applyFilter();
  }

  applyFilter() {
    this.selection.clear();
    if (this.statusFilter === 'all') {
      this.filteredSkills = [...this.allSkills];
    } else {
      this.filteredSkills = this.allSkills.filter(s => s.status === this.statusFilter);
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredSkills.length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.filteredSkills);
  }

  bulkUpdateStatus(status: string): void {
    if (this.selection.selected.length === 0) return;

    const actionText = status === 'approved' ? 'Approve' : 'Reject';
    const actionColor = status === 'approved' ? '#3085d6' : '#d33';
    const skillIds = this.selection.selected.map(s => s.id);

    const dialogRef = this.dialog.open(SkillsActionDialogComponent, {
      width: '500px',
      data: {
        type: 'confirm',
        title: `Bulk ${actionText}`,
        message: `You are about to ${actionText.toLowerCase()} ${skillIds.length} skills.`,
        actionText: actionText,
        actionColor: actionColor,
        requireRemarks: status === 'rejected'
      } as SkillsActionDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        const remarks = result.remarks || '';
        this.http.patch(`${environment.apiUrl}/skills/bulk-status`, { skill_ids: skillIds, status, remarks }).subscribe({
          next: (res: any) => {
            this.snackBar.open(`Successfully ${status} ${res.count || skillIds.length} skills.`, 'Close', { duration: 3000 });
            this.selection.selected.forEach(s => {
              s.status = status;
              s.remarks = remarks;
            });
            this.selection.clear();
            this.applyFilter();
          },
          error: (err) => {
            console.error('Error in bulk update:', err);
            this.snackBar.open('Failed to update skills', 'Close', { duration: 3000, panelClass: 'error-snackbar' });
          }
        });
      }
    });
  }

  updateSkillStatus(skill: any, status: string): void {
    const actionText = status === 'approved' ? 'Approve' : 'Reject';
    const actionColor = status === 'approved' ? '#3085d6' : '#d33';

    const dialogRef = this.dialog.open(SkillsActionDialogComponent, {
      width: '500px',
      data: {
        type: 'confirm',
        title: `Are you sure?`,
        message: `You are about to ${actionText.toLowerCase()} this skill.`,
        actionText: actionText,
        actionColor: actionColor,
        requireRemarks: status === 'rejected'
      } as SkillsActionDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        const remarks = result.remarks || '';
        this.http.patch(`${environment.apiUrl}/skills/${skill.id}/status`, { status, remarks }).subscribe({
          next: () => {
            this.snackBar.open(`Skill has been ${status}.`, 'Close', { duration: 3000 });
            skill.status = status;
            skill.remarks = remarks;
            this.applyFilter();
          },
          error: (err) => {
            console.error('Error updating skill status:', err);
            this.snackBar.open('Failed to update skill status', 'Close', { duration: 3000, panelClass: 'error-snackbar' });
          }
        });
      }
    });
  }

  getSkillImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;

    let path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    if (path.startsWith('/api/')) {
      path = path.substring(4);
    }

    const baseUrl = environment.apiUrl;
    return `${baseUrl}${path}`;
  }

  getProfileImageUrl(student: any): string {
    if (student?.img) return student.img;
    if (student?.user_profile?.profile_image) {
      let img = student.user_profile.profile_image;
      if (img.startsWith('http')) return img;

      let path = img.startsWith('/') ? img : `/${img}`;
      if (path.startsWith('/api/')) {
        path = path.substring(4);
      }
      return `${environment.apiUrl}${path}`;
    }
    return 'assets/images/user/student.jpg';
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/media.png';
  }

  viewImage(imagePath: string): void {
    const imageUrl = this.getSkillImageUrl(imagePath);
    this.dialog.open(SkillsActionDialogComponent, {
      data: { type: 'image', imageUrl: imageUrl } as SkillsActionDialogData,
      panelClass: 'image-preview-dialog',
      backdropClass: 'image-preview-backdrop',
      width: '45vw',
      height: '45vh',
      maxWidth: '1200px'
    });
  }

  editSkill(skill: any): void {
    const dialogRef = this.dialog.open(SkillsActionDialogComponent, {
      width: '500px',
      data: {
        type: 'edit',
        skillName: skill.skill_name,
        currentStatus: skill.status,
        currentRemarks: skill.remarks
      } as SkillsActionDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Send the updated status and remarks to the API
        this.http.patch(`${environment.apiUrl}/skills/${skill.id}/status`, {
          status: result.status,
          remarks: result.remarks
        }).subscribe({
          next: () => {
            this.snackBar.open('Verification updated successfully.', 'Close', { duration: 3000 });
            skill.status = result.status;
            skill.remarks = result.remarks;
            this.applyFilter();
          },
          error: (err) => {
            console.error('Error updating skill verification:', err);
            this.snackBar.open('Failed to update verification', 'Close', { duration: 3000, panelClass: 'error-snackbar' });
          }
        });
      }
    });
  }
}
