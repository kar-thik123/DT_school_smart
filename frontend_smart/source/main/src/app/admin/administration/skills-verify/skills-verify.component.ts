import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { environment } from 'environments/environment';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '@core/service/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentSkillsDialogComponent } from './skills-verify-dialog/student-skills-dialog.component';
import { SkillsActionDialogComponent, SkillsActionDialogData } from './skills-action-dialog/skills-action-dialog.component';

@Component({
  selector: 'app-skills-verify',
  templateUrl: './skills-verify.component.html',
  styleUrls: ['./skills-verify.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    BreadcrumbComponent,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class SkillsVerifyComponent implements OnInit {
  private http = inject(HttpClient);

  breadscrum = {
    title: 'Skills Verification',
    items: ['Administration'],
    active: 'Skills Verify'
  };

  skills: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'grade', 'section', 'totalSkills', 'actions'];
  isLoading = false;
  isSuperAdmin = false;
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  students: any[] = [];

  statusFilter = 'all';
  skillTypeFilter = 'all';
  gradeFilter = '';
  sectionFilter = '';
  academicYearFilter = '';

  skillTypes = ['Academic Skills', 'Extra Curricular Skills'];
  grades: any[] = [];
  sections: any[] = [];
  filteredSections: any[] = [];
  academicYears: any[] = [];

  selection = new SelectionModel<any>(true, []);

  canModify = false;
  canViewAll = false;
  canManageAll = false;

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.isSuperAdmin = user?.role === 'SUPER_ADMIN';
    this.canViewAll = this.isSuperAdmin || this.authService.hasPermission('SKILLS_VERIFICATION', 'VIEW');
    this.canManageAll = this.isSuperAdmin || this.authService.hasPermission('SKILLS_VERIFICATION', 'MANAGE');

    const isVerifier = this.authService.hasPermission('IDENTITY', 'IS_SKILL_VERIFIER');
    this.canModify = this.canManageAll || isVerifier;

    this.fetchSkills();

    if (this.canViewAll) {
      const canReadAcademic = this.isSuperAdmin ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE', 'READ') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE', 'VIEW');
      if (canReadAcademic) {
        this.loadGrades();
        this.loadSections();
        this.loadAcademicYears();
      }
    }
  }

  loadAcademicYears() {
    this.http.get<any[]>(`${environment.apiUrl}/academic/academic-years`).subscribe({
      next: (data) => this.academicYears = data,
      error: (err) => console.error(err)
    });
  }

  loadGrades() {
    this.http.get<any[]>(`${environment.apiUrl}/academic/grades`).subscribe({
      next: (data) => this.grades = data,
      error: (err) => console.error(err)
    });
  }

  loadSections() {
    this.http.get<any[]>(`${environment.apiUrl}/academic/sections`).subscribe({
      next: (data) => this.sections = data,
      error: (err) => console.error(err)
    });
  }

  fetchSkills(): void {
    this.isLoading = true;
    this.selection.clear();
    let url = `${environment.apiUrl}/skills/all?status=${this.statusFilter}`;

    if (this.skillTypeFilter !== 'all') {
      url += `&skill_type=${this.skillTypeFilter}`;
    }
    if (this.gradeFilter) {
      url += `&grade_id=${this.gradeFilter}`;
    }
    if (this.sectionFilter) {
      url += `&section_id=${this.sectionFilter}`;
    }
    if (this.academicYearFilter) {
      url += `&academic_year_id=${this.academicYearFilter}`;
    }

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.skills = res;
        this.groupSkillsByStudent(res);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching skills:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to fetch skills', 'Close', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  onFilterChange(): void {
    this.fetchSkills();
  }

  onGradeChange(): void {
    if (this.gradeFilter) {
      this.filteredSections = this.sections.filter(s => s.grade_id === this.gradeFilter);
    } else {
      this.filteredSections = [];
    }
    this.sectionFilter = '';
    this.fetchSkills();
  }

  groupSkillsByStudent(skills: any[]) {
    const studentMap = new Map<string, any>();

    for (const skill of skills) {
      const user = skill.user;
      if (!user) continue;

      if (!studentMap.has(user.id)) {
        studentMap.set(user.id, {
          user: user,
          skills: []
        });
      }

      const studentData = studentMap.get(user.id);
      studentData.skills.push(skill);
    }

    this.students = Array.from(studentMap.values());
  }

  viewStudentSkills(studentData: any) {
    const dialogRef = this.dialog.open(StudentSkillsDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      data: {
        student: studentData.user,
        skills: studentData.skills,
        canModify: this.canModify
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.fetchSkills();
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.skills.length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.skills);
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
            this.fetchSkills(); // refresh list
          },
          error: (err) => {
            console.error('Error updating bulk skills:', err);
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
          },
          error: (err) => {
            console.error('Error updating skill status:', err);
            this.snackBar.open('Failed to update skill status', 'Close', { duration: 3000, panelClass: 'error-snackbar' });
          }
        });
      }
    });
  }

  viewImage(imageUrl: string): void {
    this.dialog.open(SkillsActionDialogComponent, {
      data: { type: 'image', imageUrl: imageUrl } as SkillsActionDialogData,
      panelClass: 'image-preview-dialog',
      backdropClass: 'image-preview-backdrop',
      width: '45vw',
      height: '45vh',
      maxWidth: '1200px'
    });
  }
}
