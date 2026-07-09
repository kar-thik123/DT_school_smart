import { Component, OnInit, HostListener, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';

import { TeacherDashboardService } from './teacher-dashboard.service';
import { TeacherDashboardContextService } from './teacher-dashboard-context.service';
import { AuthService } from '@core/service/auth.service';
import { AcademicContextService } from '@core/service/academic-context.service';
import { AcademicYearService } from '../../admin/academics/academic-year/academic-year.service';
import { HierarchyDropdownComponent } from '../../admin/administration/units-list/components/hierarchy-dropdown/hierarchy-dropdown.component';
import { IGrade, ISection } from '../../admin/administration/units-list/services/units.service';

// Widget Imports
import { HeroBannerComponent } from './widgets/hero-banner/hero-banner.component';
import { OverviewMetricsComponent } from './widgets/overview-metrics/overview-metrics.component';
import { AdminKpisComponent } from './widgets/admin-kpis/admin-kpis.component';
import { SyllabusCoverageComponent } from './widgets/syllabus-coverage/syllabus-coverage.component';
import { PerformanceTrendComponent } from './widgets/performance-trend/performance-trend.component';
import { AttendanceWidgetComponent } from './widgets/attendance-widget/attendance-widget.component';
import { RecentAssessmentsComponent } from './widgets/recent-assessments/recent-assessments.component';
import { TopicMasteryComponent } from './widgets/topic-mastery/topic-mastery.component';
import { WeakStudentsComponent } from './widgets/weak-students/weak-students.component';
import { TopPerformersComponent } from './widgets/top-performers/top-performers.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatProgressBarModule,
    MatIconModule,
    FormsModule,
    HierarchyDropdownComponent,
    // Widgets
    HeroBannerComponent,
    OverviewMetricsComponent,
    AdminKpisComponent,
    SyllabusCoverageComponent,
    PerformanceTrendComponent,
    AttendanceWidgetComponent,
    RecentAssessmentsComponent,
    TopicMasteryComponent,
    WeakStudentsComponent,
    TopPerformersComponent
  ],
})
export class DashboardComponent implements OnInit {
  @ViewChild(HeroBannerComponent) heroBanner!: HeroBannerComponent;

  breadscrums = [
    {
      title: 'Dashboard',
      items: ['Teacher'],
      active: 'Dashboard',
    },
  ];

  // Assignment & Filter State (stays in shell)
  loading: boolean = true;
  error: string | null = null;

  assignments: any[] = [];
  selectedAssignment: any = null;

  uniqueClasses: { id: string; name: string; sectionId: string; gradeId?: string }[] = [];
  grades: IGrade[] = [];
  allSections: ISection[] = [];
  selectedGradeId: string | null = null;
  selectedGradeName: string = '';
  selectedClassId: string = '';
  selectedClassName: string = 'Select Class';

  isSubjectOpen: boolean = false;
  isYearOpen: boolean = false;

  availableSubjects: { id: string; name: string }[] = [];
  selectedSubjectId: string = '';
  selectedSubjectName: string = 'All Subjects';

  academicYears: any[] = [];
  academicYearName: string = '';
  selectedAcademicYearId: string = '';

  private dashboardService = inject(TeacherDashboardService);
  private contextService = inject(TeacherDashboardContextService);
  private authService = inject(AuthService);
  private academicContext = inject(AcademicContextService);
  private academicYearService = inject(AcademicYearService);

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.subject-dropdown-wrapper')) {
      this.isSubjectOpen = false;
    }
    if (!target.closest('.year-dropdown-wrapper')) {
      this.isYearOpen = false;
    }
  }

  ngOnInit() {
    this.academicContext.activeYear$.subscribe(year => {
      if (year) {
        this.academicYearName = year.academic_year || year.name;
        this.selectedAcademicYearId = year.id;
      }
    });
    this.loadAcademicYears();
    this.loadAssignments();
  }

  loadAcademicYears() {
    this.academicYearService.getAllAcademicYears().subscribe((years: any[]) => {
      this.academicYears = years;
      if (!this.academicYearName && years.length > 0) {
        this.selectedAcademicYearId = years[0].id;
        this.academicYearName = years[0].academicYear || years[0].name;
      }
    });
  }

  onYearChange(year: any) {
    this.selectedAcademicYearId = year.id;
    this.academicYearName = year.academicYear || year.name;
    this.loadAssignments();
  }

  loadAssignments() {
    this.loading = true;
    this.dashboardService.getMyAssignments().subscribe({
      next: (assignments: any[]) => {
        this.assignments = assignments || [];
        if (this.assignments.length > 0) {
          this.processAssignments();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading assignments', err);
        this.error = 'Unable to load class assignments.';
        this.loading = false;
      }
    });
  }

  processAssignments() {
    const classMap = new Map();
    const gradeMap = new Map<string, any>();
    const sectionMap = new Map<string, any>();

    this.assignments.forEach(a => {
      if (a.section) {
        const classId = a.section_id;
        if (!classMap.has(classId)) {
          classMap.set(classId, {
            id: classId,
            sectionId: classId,
            gradeId: a.grade?.id,
            name: `${a.grade?.name} - ${a.section?.name}`
          });
        }
        if (a.grade && !gradeMap.has(a.grade.id)) {
           gradeMap.set(a.grade.id, { id: a.grade.id, name: a.grade.name });
        }
        if (!sectionMap.has(a.section.id)) {
           sectionMap.set(a.section.id, { id: a.section.id, name: a.section.name, grade_id: a.grade?.id });
        }
      }
    });
    this.uniqueClasses = Array.from(classMap.values());
    this.grades = Array.from(gradeMap.values());
    this.allSections = Array.from(sectionMap.values());

    if (this.uniqueClasses.length > 0) {
      const classTeacherAssignment = this.assignments.find(a => a.assignment_type === 'CLASS_TEACHER');
      let defaultClass = this.uniqueClasses[0];
      if (classTeacherAssignment) {
         defaultClass = this.uniqueClasses.find(c => c.id === classTeacherAssignment.section_id) || this.uniqueClasses[0];
      }
      
      this.selectedClassId = defaultClass.id;
      this.selectedGradeId = defaultClass.gradeId || null;
      this.selectedGradeName = this.grades.find(g => g.id === this.selectedGradeId)?.name || '';
      this.onClassChange();
    } else {
      this.loading = false;
    }
  }

  onHierarchyChange(event: { grade: IGrade, section: ISection | 'ALL' }) {
    this.selectedGradeId = event.grade.id;
    this.selectedGradeName = event.grade.name;
    if (event.section !== 'ALL') {
      this.selectedClassId = event.section.id;
      this.onClassChange();
    }
  }

  onClassChange() {
    const selectedClass = this.uniqueClasses.find(c => c.id === this.selectedClassId);
    if (selectedClass) {
       this.selectedClassName = selectedClass.name.split(' - ')[1] || selectedClass.name;
    } else {
       this.selectedClassName = 'Select Class';
    }

    const assignmentsForClass = this.assignments.filter(a => a.section_id === this.selectedClassId);
    const subMap = new Map();
    assignmentsForClass.forEach(a => {
      if (a.subject) {
        subMap.set(a.subject_id, { id: a.subject_id, name: a.subject.name });
      }
    });
    this.availableSubjects = Array.from(subMap.values());
    
    if (this.availableSubjects.length > 0) {
      const subjectAssignment = assignmentsForClass.find(a => a.assignment_type === 'SUBJECT_TEACHER' && a.subject_id);
      if (subjectAssignment && this.availableSubjects.find(s => s.id === subjectAssignment.subject_id)) {
         this.selectedSubjectId = subjectAssignment.subject_id;
      } else {
         this.selectedSubjectId = this.availableSubjects[0].id;
      }
    } else {
      this.selectedSubjectId = '';
    }

    this.onSubjectChange();
  }

  onSubjectChange() {
    const selectedSub = this.availableSubjects.find(s => s.id === this.selectedSubjectId);
    this.selectedSubjectName = selectedSub ? selectedSub.name : 'All Subjects';
    this.updateSelectedAssignment();
  }

  updateSelectedAssignment() {
    this.selectedAssignment = this.assignments.find(a => 
      a.section_id === this.selectedClassId && 
      (!this.selectedSubjectId || a.subject_id === this.selectedSubjectId || a.assignment_type === 'CLASS_TEACHER')
    );
    if (!this.selectedAssignment && this.assignments.length > 0) {
        this.selectedAssignment = this.assignments[0];
    }

    // Update the hero banner with class info
    if (this.heroBanner && this.selectedAssignment) {
      this.heroBanner.setClassInfo(
        this.selectedAssignment.grade?.name || this.selectedGradeName,
        this.selectedAssignment.section?.name || this.selectedClassName
      );
    }

    // Broadcast context to all widgets - this triggers independent data loading
    this.contextService.setContext(
      this.selectedClassId,
      this.selectedSubjectId || undefined
    );

    this.loading = false;
  }
}
