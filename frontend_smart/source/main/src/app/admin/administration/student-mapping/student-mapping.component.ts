import { Component, OnInit, inject, Inject, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

import { AcademicStructureService, IGrade, ISection } from '../academic-structure/services/academic-structure.service';
import { AcademicYearService } from '../../academics/academic-year/academic-year.service';
import { StudentEnrollmentService } from './services/student-enrollment.service';
import { AcademicContextService } from '@core';
import { MatMenuModule, MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { OverlayContainer } from '@angular/cdk/overlay';
import { AcademicContextSelectorComponent, IAcademicContextSelection } from '@shared/components/academic-context-selector/academic-context-selector.component';

@Component({
  selector: 'app-simple-test-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `<div class="p-4"><h3>Test Dialog Works!</h3><button mat-dialog-close>Close</button></div>`
})
export class SimpleTestDialogComponent {}

import { TransferStudentDialogComponent } from './dialogs/transfer-student-dialog.component';
import { WithdrawStudentDialogComponent } from './dialogs/withdraw-student-dialog.component';

@Component({
  selector: 'app-student-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    BreadcrumbComponent,
    AcademicContextSelectorComponent
  ],
  templateUrl: './student-mapping.component.html',
  styleUrls: ['./student-mapping.component.scss']
})
export class StudentMappingComponent implements OnInit {
  private enrollmentService = inject(StudentEnrollmentService);
  private academicService = inject(AcademicStructureService);
  private academicYearService = inject(AcademicYearService);
  private academicContextService = inject(AcademicContextService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private overlayContainer = inject(OverlayContainer);

  @ViewChildren(MatMenuTrigger) menuTriggers!: QueryList<MatMenuTrigger>;
  @ViewChild('sharedRowMenu') sharedMenu!: MatMenu;

  breadscrums = [
    { title: 'Student Enrollment & Mapping', items: ['Administration'], active: 'Student Enrollment' }
  ];

  activeAcademicYear: any;
  academicYears: any[] = [];
  grades: IGrade[] = [];
  sections: ISection[] = [];
  subjectGroups: any[] = [];

  // Global Context State
  globalGradeId: string | null = null;
  globalSectionId: string | null = null;
  globalGroupId: string | null = null;
  globalGradeName: string = '';
  globalSectionName: string = '';
  globalGroupName: string = '';
  
  // Tab 1: Single/List
  enrollments: any[] = [];
  _groupedEnrollments: any[] = [];
  isLoading = false;

  // Tab 2: Bulk
  unenrolledStudents: any[] = [];
  selectedBulkStudentIds: string[] = [];
  bulkSearchQuery: string = '';
  isBulkSaving = false;

  ngOnInit() {
    // Subscribe to centralized Academic Context
    this.academicContextService.activeYear$.subscribe((year: any) => {
      if (year) {
        this.activeAcademicYear = year;
        this.loadUnenrolledStudents();
        this.loadEnrollments();
      }
    });

    this.loadInitialData();
  }

  loadInitialData() {
    this.academicYearService.getAllAcademicYears().subscribe((years: any) => {
      this.academicYears = years;
      if (!this.activeAcademicYear && years.length > 0) {
        this.activeAcademicYear = years.find((y: any) => y.is_active) || years[0];
        if (this.activeAcademicYear) {
          this.loadUnenrolledStudents();
          this.loadEnrollments();
        }
      }
    });

    this.academicService.getGrades().subscribe((grades) => this.grades = grades);
    this.academicService.getSections().subscribe((sections) => this.sections = sections);
  }

  compareYears(y1: any, y2: any): boolean {
    return y1 && y2 ? y1.id === y2.id : y1 === y2;
  }

  onYearChange() {
    if (this.activeAcademicYear) {
      this.loadUnenrolledStudents();
      this.loadEnrollments();
    }
  }

  loadEnrollments() {
    if (!this.activeAcademicYear) return;
    this.isLoading = true;
    const params: any = {};
    if (this.globalGradeId) params.grade_id = this.globalGradeId;
    if (this.globalSectionId) params.section_id = this.globalSectionId;

    this.enrollmentService.getEnrollments(params).subscribe({
      next: (data) => {
        this.enrollments = data;
        this.groupEnrollments();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('error', 'Failed to load enrollments');
      }
    });
  }

  groupEnrollments() {
    const groups: any[] = [];
    
    // Group by Grade
    const grades = new Set(this.enrollments.map(e => e.grade.id));
    grades.forEach(gId => {
      const gEnrollments = this.enrollments.filter(e => e.grade.id === gId);
      if (gEnrollments.length === 0) return;
      const gName = gEnrollments[0].grade.name;

      const sectionGroups: any[] = [];
      const sections = new Set(gEnrollments.map(e => e.section?.id || 'none'));
      
      sections.forEach(sId => {
        const sEnrollments = gEnrollments.filter(e => (e.section?.id || 'none') === sId);
        const sName = sId === 'none' ? 'No Section' : sEnrollments[0].section?.name;
        
        sectionGroups.push({
          sectionName: sName,
          enrollments: sEnrollments
        });
      });

      groups.push({
        gradeName: gName,
        sections: sectionGroups
      });
    });

    this._groupedEnrollments = groups;
  }

  loadUnenrolledStudents() {
    if (!this.activeAcademicYear) return;
    this.enrollmentService.getUnenrolledStudents(this.bulkSearchQuery).subscribe((data) => {
      this.unenrolledStudents = data;
    });
  }

  onBulkSearch() {
    this.loadUnenrolledStudents();
  }

  onGlobalAcademicContextChange(context: IAcademicContextSelection) {
    this.globalGradeId = context.grade?.id || null;
    this.globalGradeName = context.grade?.name || '';
    
    if (context.section && context.section !== 'ALL') {
      this.globalSectionId = context.section.id;
      this.globalSectionName = context.section.name;
    } else {
      this.globalSectionId = null;
      this.globalSectionName = '';
    }
    
    this.globalGroupId = context.subjectGroup?.id || null;
    this.globalGroupName = context.subjectGroup?.name || '';

    if (this.globalGradeId && this.globalSectionId) {
      this.academicService.getSubjectGroups(this.globalGradeId, this.globalSectionId, false).subscribe(groups => {
        this.subjectGroups = groups;
        if (groups.length === 1 && !this.globalGroupId) {
          this.globalGroupId = groups[0].id;
          this.globalGroupName = groups[0].name;
        }
      });
    } else {
      this.subjectGroups = [];
    }

    this.loadEnrollments();
  }

  onBulkStudentSelect(event: any, studentId: string) {
    if (event.checked) {
      this.selectedBulkStudentIds = [...this.selectedBulkStudentIds, studentId];
    } else {
      this.selectedBulkStudentIds = this.selectedBulkStudentIds.filter(id => id !== studentId);
    }
  }

  toggleAllStudents(event: any) {
    if (event.checked) {
      this.selectedBulkStudentIds = this.unenrolledStudents.map(s => s.id);
    } else {
      this.selectedBulkStudentIds = [];
    }
  }

  bulkEnroll() {
    if (!this.activeAcademicYear || !this.globalGradeId || this.selectedBulkStudentIds.length === 0) return;
    
    this.isBulkSaving = true;
    const payload = {
      grade_id: this.globalGradeId,
      section_id: this.globalSectionId,
      subject_group_id: this.globalGroupId,
      student_ids: this.selectedBulkStudentIds
    };

    this.enrollmentService.bulkEnroll(payload).subscribe({
      next: () => {
        this.isBulkSaving = false;
        this.showNotification('success', 'Bulk enrollment successful');
        this.selectedBulkStudentIds = [];
        this.loadUnenrolledStudents();
        this.loadEnrollments();
      },
      error: (err) => {
        this.isBulkSaving = false;
        this.showNotification('error', err.error?.message || 'Failed to bulk enroll');
      }
    });
  }

  // Removed getFilteredSections as handled by shared component

  // Get grouped enrollments
  get groupedEnrollments() {
    return this._groupedEnrollments;
  }

  trackByGrade(index: number, item: any) {
    return item.gradeName;
  }

  trackBySection(index: number, item: any) {
    return item.sectionName;
  }

  trackByEnrollment(index: number, item: any) {
    return item.id;
  }

  openTransferDialog(enrollment: any) {
    const dialogRef = this.dialog.open(TransferStudentDialogComponent, {
      width: '500px',
      data: {
        enrollment,
        grades: this.grades,
        sections: this.sections,
        payload: {
          to_grade_id: enrollment.grade.id,
          to_section_id: enrollment.section?.id || null,
          to_subject_group_id: enrollment.subject_group?.id || null,
          reason: ''
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.enrollmentService.transferStudent(enrollment.id, result).subscribe({
          next: () => {
            this.showNotification('success', 'Student transferred successfully');
            this.loadEnrollments();
          },
          error: (err) => {
            this.showNotification('error', err.error?.message || 'Failed to transfer student');
          }
        });
      }
    });
  }

  openWithdrawDialog(enrollment: any) {
    const dialogRef = this.dialog.open(WithdrawStudentDialogComponent, {
      width: '500px',
      data: {
        enrollment,
        payload: { reason: '' }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.enrollmentService.withdrawStudent(enrollment.id, result).subscribe({
          next: () => {
            this.showNotification('success', 'Student withdrawn successfully');
            this.loadEnrollments();
          },
          error: (err) => {
            this.showNotification('error', err.error?.message || 'Failed to withdraw student');
          }
        });
      }
    });
  }

  activateStudent(enrollment: any) {
    if (!confirm(`Are you sure you want to activate ${enrollment.student.name}?`)) return;
    
    this.enrollmentService.activateStudent(enrollment.id).subscribe({
      next: () => {
        this.showNotification('success', 'Student activated successfully');
        this.loadEnrollments();
      },
      error: (err) => {
        this.showNotification('error', err.error?.message || 'Failed to activate student');
      }
    });
  }

  unassignStudent(enrollment: any) {
    if (!confirm(`Are you sure you want to unassign ${enrollment.student.name}?`)) return;
    
    this.enrollmentService.unassignStudent(enrollment.student_id).subscribe({
      next: () => {
        this.showNotification('success', 'Student unassigned successfully');
        this.loadEnrollments();
        this.loadUnenrolledStudents();
      },
      error: (err) => {
        this.showNotification('error', err.error?.message || 'Failed to unassign student');
      }
    });
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-danger'
    });
  }
}
