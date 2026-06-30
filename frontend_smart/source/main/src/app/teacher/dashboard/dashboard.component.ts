import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexGrid,
  ApexLegend,
  ApexFill,
  NgApexchartsModule,
  ApexNonAxisChartSeries,
} from 'ng-apexcharts';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { TeacherDashboardService, OverviewMetrics, PerformanceTrend, TopicMastery, WeakStudent, RecentAssessment, SummaryStats, TopPerformer, SyllabusCoverage, UnreadMessages } from './teacher-dashboard.service';
import { AuthService } from '@core/service/auth.service';
import { AcademicContextService } from '@core/service/academic-context.service';
import { AcademicYearService } from '../../admin/academics/academic-year/academic-year.service';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { HierarchyDropdownComponent } from '../../admin/administration/units-list/components/hierarchy-dropdown/hierarchy-dropdown.component';
import { IGrade, ISection } from '../../admin/administration/units-list/services/units.service';

export type areaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  grid: ApexGrid;
  colors: string[];
};

export type radialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
};

export type donutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    NgApexchartsModule,
    MatButtonModule,
    MatTableModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    HierarchyDropdownComponent
  ],
})
export class DashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public performanceTrendOptions!: Partial<areaChartOptions>;
  public attendanceChartOptions!: Partial<radialChartOptions>;
  public topicMasteryOptions!: Partial<donutChartOptions>;

  breadscrums = [
    {
      title: 'Dashboard',
      items: ['Teacher'],
      active: 'Dashboard',
    },
  ];

  // State Variables
  loading: boolean = true;
  error: string | null = null;
  teacherName: string = '';

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

  overview: OverviewMetrics | null = null;
  performanceTrend: PerformanceTrend[] = [];
  topicMastery: TopicMastery[] = [];
  weakStudents: WeakStudent[] = [];
  recentAssessments: RecentAssessment[] = [];
  summaryStats: SummaryStats | null = null;
  showAllMasterySubjects: boolean = false;
  showAllRiskStudents: boolean = false;

  topPerformers: TopPerformer[] = [];
  unreadMessages: UnreadMessages | null = null;
  pendingSkillsCount: number = 0;
  syllabusCoverage: SyllabusCoverage | null = null;
  homeworkComplianceRate: number = 0;

  toggleMasterySubjects() {
    this.showAllMasterySubjects = !this.showAllMasterySubjects;
  }

  toggleRiskStudents() {
    this.showAllRiskStudents = !this.showAllRiskStudents;
  }

  constructor(
    private dashboardService: TeacherDashboardService,
    private authService: AuthService,
    private academicContext: AcademicContextService,
    private academicYearService: AcademicYearService
  ) {
    const user = this.authService.currentUserValue;
    if (user && user.name) {
      this.teacherName = user.name;
    }
  }

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
    // Potentially reload dashboard data for the selected year here.
    // For now, we update the display. If the backend endpoints support academic_year_id filtering,
    // we would pass it to loadAssignments/dashboardService.
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
       this.selectedClassName = selectedClass.name.split(' - ')[1] || selectedClass.name; // just section name
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
    this.loadDashboardData();
  }

  loadDashboardData() {
    if (!this.selectedClassId) return;

    this.loading = true;
    this.error = null;

    const sectionId = this.selectedClassId;
    const subjectId = this.selectedSubjectId || undefined;

    forkJoin({
      overview: this.dashboardService.getOverview(sectionId, subjectId).pipe(catchError(() => of(null))),
      performanceTrend: this.dashboardService.getPerformanceTrend(sectionId, subjectId).pipe(catchError(() => of({ trend: [] }))),
      topicMastery: this.dashboardService.getTopicMastery(sectionId, subjectId).pipe(catchError(() => of([]))),
      weakStudents: this.dashboardService.getWeakStudents(sectionId, subjectId).pipe(catchError(() => of([]))),
      recentAssessments: this.dashboardService.getRecentAssessments(sectionId, subjectId).pipe(catchError(() => of([]))),
      summaryStats: this.dashboardService.getSummaryStats(sectionId, subjectId).pipe(catchError(() => of(null))),
      topPerformers: this.dashboardService.getTopPerformers(sectionId, subjectId).pipe(catchError(() => of([]))),
      unreadMessages: this.dashboardService.getUnreadMessages().pipe(catchError(() => of(null))),
      pendingSkills: this.dashboardService.getPendingSkills(sectionId).pipe(catchError(() => of({ count: 0 }))),
      syllabusCoverage: this.dashboardService.getSyllabusCoverage(sectionId, subjectId).pipe(catchError(() => of(null))),
      homeworkCompliance: this.dashboardService.getHomeworkCompliance(sectionId).pipe(catchError(() => of({ rate: 0 })))
    }).subscribe({
      next: (data: any) => {
        this.overview = data.overview;
        this.performanceTrend = data.performanceTrend?.trend || [];
        this.topicMastery = data.topicMastery || [];
        this.weakStudents = data.weakStudents || [];
        this.recentAssessments = data.recentAssessments || [];
        this.summaryStats = data.summaryStats;
        this.topPerformers = data.topPerformers || [];
        this.unreadMessages = data.unreadMessages;
        this.pendingSkillsCount = data.pendingSkills?.count || 0;
        this.syllabusCoverage = data.syllabusCoverage;
        this.homeworkComplianceRate = data.homeworkCompliance?.rate || 0;

        if (this.availableSubjects.length === 0 && this.selectedSubjectId === '' && this.topicMastery.length > 0) {
          this.availableSubjects = this.topicMastery.map((t: any) => ({ id: t.subjectId, name: t.topicName }));
        }

        this.initCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.error = 'Unable to load dashboard data.';
        this.loading = false;
      }
    });
  }

  private initCharts() {
    this.initPerformanceTrendChart();
    this.initAttendanceChart();
    this.initTopicMasteryChart();
  }

  private initAttendanceChart() {
    this.attendanceChartOptions = {
      series: [this.summaryStats?.attendancePercentage || 0],
      chart: {
        type: 'radialBar',
        height: 140,
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: { size: '65%' },
          track: {
            background: '#e2e8f0',
            strokeWidth: '100%',
            margin: 0
          },
          dataLabels: {
            name: { show: false },
            value: {
              offsetY: 0,
              fontSize: '20px',
              fontWeight: 700,
              formatter: function (val) {
                return val.toFixed(1) + "%";
              }
            }
          }
        }
      },
      colors: ['#14b8a6'],
      labels: ['Attendance'],
    };
  }

  private initPerformanceTrendChart() {
    if (!this.performanceTrend || this.performanceTrend.length === 0) {
      this.performanceTrendOptions = {};
      return;
    }

    const categories = this.performanceTrend.map(item => item.examName);
    const scores = this.performanceTrend.map(item => item.avgScore);

    this.performanceTrendOptions = {
      series: [
        {
          name: 'Class Average %',
          data: scores,
        }
      ],
      chart: {
        height: 250,
        type: 'area',
        toolbar: { show: false },
        foreColor: 'var(--bs-secondary-color)',
        sparkline: { enabled: false }
      },
      colors: ['var(--bs-primary)'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: categories, labels: { style: { fontSize: '10px' } } },
      yaxis: { min: 0, max: 100, labels: { formatter: (val) => val.toFixed(0) + '%' } },
      grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
      legend: { show: false },
    };
  }



  private initTopicMasteryChart() {
    if (!this.topicMastery || this.topicMastery.length === 0) {
      this.topicMasteryOptions = {};
      return;
    }

    const completed = this.topicMastery.filter(t => t.completed).length;
    const remaining = this.topicMastery.length - completed;

    this.topicMasteryOptions = {
      series: [completed, remaining],
      chart: { height: 200, type: 'donut' },
      labels: ['Completed', 'Pending'],
      colors: ['var(--bs-success)', 'var(--bs-warning)'],
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              value: { fontSize: '18px', fontWeight: 'bold' },
              total: { show: true, label: 'Topics', fontSize: '14px', color: 'var(--bs-secondary-color)' }
            }
          }
        }
      }
    };
  }
}
