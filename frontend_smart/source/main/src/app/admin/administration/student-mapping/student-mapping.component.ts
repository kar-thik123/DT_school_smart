import { Component, OnInit, inject } from '@angular/core';
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
    BreadcrumbComponent
  ],
  templateUrl: './student-mapping.component.html',
  styleUrls: ['./student-mapping.component.scss']
})
export class StudentMappingComponent implements OnInit {
  private enrollmentService = inject(StudentEnrollmentService);
  private academicService = inject(AcademicStructureService);
  private academicYearService = inject(AcademicYearService);
  private snackBar = inject(MatSnackBar);

  breadscrums = [
    { title: 'Student Enrollment & Mapping', items: ['Administration'], active: 'Student Enrollment' }
  ];

  activeAcademicYear: any;
  academicYears: any[] = [];
  grades: IGrade[] = [];
  sections: ISection[] = [];
  subjectGroups: any[] = [];

  // Tab 1: Single/List
  enrollments: any[] = [];
  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;
  isLoading = false;

  // Tab 2: Bulk
  unenrolledStudents: any[] = [];
  selectedBulkStudentIds: string[] = [];
  bulkSearchQuery: string = '';
  bulkGradeId: string | null = null;
  bulkSectionId: string | null = null;
  bulkGroupId: string | null = null;
  isBulkSaving = false;

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.academicYearService.getAllAcademicYears().subscribe((years: any) => {
      this.academicYears = years;
      this.activeAcademicYear = years.find((y: any) => y.is_active) || years[0] || null;
      if (this.activeAcademicYear) {
        this.loadUnenrolledStudents();
        this.loadEnrollments();
      }
    });

    this.academicService.getGrades().subscribe((grades) => this.grades = grades);
    this.academicService.getSections().subscribe((sections) => this.sections = sections);
  }

  loadEnrollments() {
    if (!this.activeAcademicYear) return;
    this.isLoading = true;
    const params: any = { academic_year_id: this.activeAcademicYear.id };
    if (this.selectedGradeId) params.grade_id = this.selectedGradeId;
    if (this.selectedSectionId) params.section_id = this.selectedSectionId;

    this.enrollmentService.getEnrollments(params).subscribe({
      next: (data) => {
        this.enrollments = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('error', 'Failed to load enrollments');
      }
    });
  }

  loadUnenrolledStudents() {
    if (!this.activeAcademicYear) return;
    this.enrollmentService.getUnenrolledStudents(this.activeAcademicYear.id, this.bulkSearchQuery).subscribe((data) => {
      this.unenrolledStudents = data;
    });
  }

  onBulkSearch() {
    this.loadUnenrolledStudents();
  }

  onFilterChange() {
    this.loadEnrollments();
  }

  onBulkGradeChange() {
    this.bulkSectionId = null;
    this.bulkGroupId = null;
    this.subjectGroups = [];
  }

  onBulkSectionChange() {
    this.bulkGroupId = null;
    if (this.bulkGradeId && this.bulkSectionId) {
      this.academicService.getSubjectGroups(this.bulkGradeId, this.bulkSectionId).subscribe(groups => {
        this.subjectGroups = groups;
        if (groups.length === 1) {
          this.bulkGroupId = groups[0].id;
        }
      });
    } else {
      this.subjectGroups = [];
    }
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
    if (!this.activeAcademicYear || !this.bulkGradeId || this.selectedBulkStudentIds.length === 0) return;
    
    this.isBulkSaving = true;
    const payload = {
      academic_year_id: this.activeAcademicYear.id,
      grade_id: this.bulkGradeId,
      section_id: this.bulkSectionId,
      subject_group_id: this.bulkGroupId,
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

  getFilteredSections(gradeId: string | null): ISection[] {
    if (!gradeId) return [];
    return this.sections.filter(s => s.grade_id === gradeId);
  }

  // Get grouped enrollments
  get groupedEnrollments() {
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

    return groups;
  }

  unassignStudent(enrollment: any) {
    if (!confirm(`Are you sure you want to unassign ${enrollment.student.name}?`)) return;
    
    this.enrollmentService.unassignStudent(enrollment.student_id, enrollment.academic_year_id).subscribe({
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
