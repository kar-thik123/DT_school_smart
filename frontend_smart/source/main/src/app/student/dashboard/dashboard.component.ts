import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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


import { StudentDashboardService } from './dashboard.service';
import {
  StudentOverview,
  StudentKPIs,
  SubjectPerformance,
  WeeklyTrend,
  CurriculumProgress,
  TeacherAssignment,
  TimelineActivity,
  StudentSkill,
  AttendanceSummary,
  ContinueLearning,
  ExaminationAnalyticsResponse,
  ExaminationSummary,
  ExaminationHistory,
  ExaminationSubject
} from './dashboard.model';

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

export type skillsDonutChartOptions = {
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
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    NgApexchartsModule,
    MatButtonModule,
    MatTableModule,
    RouterModule
  ],
})
export class DashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public areaChartOptions!: Partial<areaChartOptions>;
  public radialChartOptions!: Partial<radialChartOptions>;
  public skillsDonutChartOptions!: Partial<skillsDonutChartOptions>;
  public attendanceChartOptions!: Partial<radialChartOptions>;
  public examTrendChartOptions!: Partial<areaChartOptions>;

  breadscrums = [
    {
      title: 'Home',
      items: ['Student'],
      active: 'Learner Home',
    },
  ];

  // State Variables
  loading: boolean = true;
  error: string | null = null;

  overview: StudentOverview | null = null;
  kpis: StudentKPIs | null = null;
  subjects: SubjectPerformance[] = [];
  weeklyTrend: WeeklyTrend[] = [];
  curriculum: CurriculumProgress[] = [];
  teachers: TeacherAssignment[] = [];
  activities: TimelineActivity[] = [];
  skills: StudentSkill[] = [];
  attendance: AttendanceSummary | null = null;
  continueLearning: ContinueLearning | null = null;
  examAnalytics: ExaminationAnalyticsResponse | null = null;

  // Derived KPIs
  curriculumCompletionPercentage: number = 0;
  verifiedSkillsCount: number = 0;
  pendingSkillsCount: number = 0;

  // New Dashboard Home States
  heroState: any = null;
  
  // KPI Trends
  readinessTrendDiff: number = 0;
  coverageTrendDiff: number = 0;
  accuracyTrendDiff: number = 0;

  // Action Center
  actionableTasks: any[] = [];
  
  // Weekly Growth
  questionsThisWeek: number = 0;
  accuracyThisWeek: number = 0;
  bestSubject: string = 'N/A';
  improvementText: string = '';

  // Timeline & Achievements
  groupedActivities: any[] = [];
  achievementsGrid: any[] = [];

  // Permission & Flow
  hasPracticePermission: boolean = true;
  isEnrolled: boolean = true;
  notEnrolledInActiveYear: boolean = false;

  // Table Config
  teacherDisplayedColumns: string[] = ['name', 'action'];
  subjectAnalyticsDisplayedColumns: string[] = ['subject', 'unit', 'topic', 'subtopic', 'coverage', 'accuracy', 'ready'];

  // Getters for specific views
  get sortedSkills(): StudentSkill[] {
    if (!this.skills) return [];
    return [...this.skills].sort((a, b) => {
      if (a.status === 'approved' && b.status !== 'approved') return -1;
      if (a.status !== 'approved' && b.status === 'approved') return 1;
      return 0;
    });
  }

  // Compact KPI Getters
  get readinessTrendText(): string {
    return this.readinessTrendDiff >= 0 
      ? `↑ ${this.readinessTrendDiff.toFixed(1)}% Weekly` 
      : `↓ ${Math.abs(this.readinessTrendDiff).toFixed(1)}% Weekly`;
  }
  
  get coverageTrendText(): string {
    return this.coverageTrendDiff >= 0 
      ? `↑ ${this.coverageTrendDiff.toFixed(1)}% Weekly` 
      : `↓ ${Math.abs(this.coverageTrendDiff).toFixed(1)}% Weekly`;
  }

  get curriculumStatusText(): string {
    return this.curriculumCompletionPercentage > 0 ? 'On Track' : 'Needs Action';
  }

  constructor(
    private dashboardService: StudentDashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    this.dashboardService.getOverview().pipe(
      catchError(() => of(null)),
      switchMap((overview: any) => {
        const skills$ = overview && overview.academic_year_id
          ? this.dashboardService.getSkills(overview.academic_year_id).pipe(catchError(() => of([])))
          : of([]);

        return forkJoin({
          overview: of(overview),
          skills: skills$,
          kpis: this.dashboardService.getKPIs().pipe(catchError(() => of(null))),
          subjects: this.dashboardService.getSubjectPerformance().pipe(catchError(() => of([]))),
          weeklyTrend: this.dashboardService.getWeeklyTrend().pipe(catchError(() => of([]))),
          curriculum: this.dashboardService.getCurriculumProgress().pipe(catchError(() => of([]))),
          teachers: this.dashboardService.getTeachers().pipe(catchError(() => of([]))),
          activities: this.dashboardService.getActivities().pipe(catchError(() => of([]))),
          attendance: this.dashboardService.getAttendance().pipe(catchError(() => of(null))),
          continueLearning: this.dashboardService.getContinueLearning().pipe(catchError(() => of(null))),
          examAnalytics: this.dashboardService.getExaminationAnalytics().pipe(catchError(() => of(null)))
        });
      })
    ).subscribe({
      next: (data: any) => {
        this.overview = data.overview;
        this.kpis = data.kpis;
        this.subjects = (data.subjects || []).sort((a: SubjectPerformance, b: SubjectPerformance) => a.readiness - b.readiness);
        this.weeklyTrend = data.weeklyTrend || [];
        this.curriculum = data.curriculum || [];
        this.teachers = data.teachers || [];
        this.skills = data.skills || [];
        this.activities = data.activities || [];
        this.attendance = data.attendance;
        this.continueLearning = data.continueLearning;
        this.examAnalytics = data.examAnalytics;
        
        // Validation
        this.hasPracticePermission = this.kpis !== null;
        this.isEnrolled = !!(this.overview && (this.overview.grade || this.overview.last_enrollment));
        this.notEnrolledInActiveYear = !!(this.overview && !this.overview.grade);

        // Core Derivations
        this.verifiedSkillsCount = this.skills.filter((s: StudentSkill) => s.status === 'approved').length;
        this.pendingSkillsCount = this.skills.filter((s: StudentSkill) => s.status === 'pending').length;
        const topicsCompleted = this.curriculum.reduce((sum, c) => sum + c.topics_completed, 0);
        const pendingTopics = this.curriculum.reduce((sum, c) => sum + (c.topics_total - c.topics_completed), 0);
        const totalTopics = topicsCompleted + pendingTopics;
        this.curriculumCompletionPercentage = totalTopics > 0 ? (topicsCompleted / totalTopics) * 100 : 0;

        // Build Gamified States
        this.computeHeroState();
        this.computeTrendsAndGrowth();
        this.buildActionCenter();
        this.buildAchievementsEngine(topicsCompleted);
        this.groupTimelineActivities();

        // Charts
        this.initWeeklyTrendChart();
        this.initRadialChart();
        this.initSkillsDonutChart();
        this.initAttendanceChart();
        this.initExamTrendChart();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.error = 'Unable to load dashboard data.';
        this.loading = false;
      }
    });
  }

  private computeHeroState() {
    if (this.subjects.length > 0) {
      const activeSubject = this.subjects[0];
      
      let currentTopic = 'Introduction Module';
      const lastCompletion = this.activities.find(a => a.type === 'completion');
      if (lastCompletion && lastCompletion.description) {
        currentTopic = lastCompletion.description.replace('Completed Topic: ', '');
      } else {
        const lastPractice = this.activities.find(a => a.type === 'practice');
        if (lastPractice && lastPractice.description) {
          currentTopic = lastPractice.description;
        }
      }

      this.heroState = {
        subject: activeSubject.subjectName,
        topic: currentTopic,
        progress: `${activeSubject.topicCompleted} of ${activeSubject.topicTotal} Topics Completed`,
        percentage: activeSubject.topicTotal > 0 ? ((activeSubject.topicCompleted / activeSubject.topicTotal) * 100).toFixed(0) : 0
      };
    } else {
      this.heroState = { subject: 'Introduction', topic: 'Getting Started', progress: '0 of 1 Topics Completed', percentage: 0 };
    }
  }

  private computeTrendsAndGrowth() {
    if (this.weeklyTrend && this.weeklyTrend.length >= 2) {
      const sortedData = [...this.weeklyTrend].sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
      const last = sortedData[sortedData.length - 1];
      const prev = sortedData[sortedData.length - 2];
      const first = sortedData[0];

      this.readinessTrendDiff = last.readiness - prev.readiness;
      this.coverageTrendDiff = last.coverage - prev.coverage;
      this.accuracyTrendDiff = last.accuracy - prev.accuracy;
      
      const overallDiff = last.readiness - first.readiness;
      if (overallDiff > 0) {
        this.improvementText = `Your exam readiness improved by ${overallDiff.toFixed(1)}% compared to your first week.`;
      } else {
        this.improvementText = `Stay consistent to see long-term improvement!`;
      }
    } else {
      this.readinessTrendDiff = 0;
      this.coverageTrendDiff = 0;
      this.accuracyTrendDiff = 0;
      this.improvementText = 'Keep practicing to unlock insights.';
    }

    if (this.subjects && this.subjects.length > 0) {
      const best = [...this.subjects].sort((a, b) => b.readiness - a.readiness)[0];
      this.bestSubject = best.subjectName;
    }
  }

  private buildActionCenter() {
    this.actionableTasks = [];
    
    if (this.subjects.length > 0) {
      const weakest = [...this.subjects].sort((a, b) => a.readiness - b.readiness)[0];
      this.actionableTasks.push({
        priority: '🔥 Recommended',
        icon: 'fas fa-book-open',
        title: `Continue ${weakest.subjectName}`,
        subtitle: 'Improve your accuracy',
        duration: '15 min',
        action: 'Resume'
      });
    }

    const pendingCurriculums = this.curriculum.filter(c => c.topics_completed < c.topics_total);
    if (pendingCurriculums.length > 0) {
      this.actionableTasks.push({
        priority: '📚 Curriculum',
        icon: 'fas fa-tasks',
        title: `Complete ${pendingCurriculums[0].subject_name} Quiz`,
        subtitle: '1 topic pending',
        duration: '10 min',
        action: 'Start'
      });
    }

    if (this.pendingSkillsCount > 0) {
      const pendingSkill = this.skills.find(s => s.status === 'pending');
      this.actionableTasks.push({
        priority: '⭐ Portfolio',
        icon: 'fas fa-star',
        title: `Verify ${pendingSkill?.skill_name || 'Skill'}`,
        subtitle: 'Submit evidence',
        duration: '2 min',
        action: 'Verify'
      });
    }
    
    if (this.actionableTasks.length === 0) {
       this.actionableTasks.push({
        priority: '🎯 Practice',
        icon: 'fas fa-gamepad',
        title: `Daily Challenge`,
        subtitle: 'Solve 10 random questions',
        duration: '5 min',
        action: 'Play'
      });
    }
  }

  private buildAchievementsEngine(topicsCompleted: number) {
    this.achievementsGrid = [];
    const read = this.kpis?.readyForExam || 0;

    this.achievementsGrid.push({
      id: 'acc_champ',
      title: 'Exam Ready',
      icon: 'fas fa-trophy',
      color: 'text-warning',
      locked: read < 80,
      progress: read >= 80 ? 'Unlocked' : `${read.toFixed(0)}% / 80%`
    });

    this.achievementsGrid.push({
      id: 'topic_master',
      title: 'Topic Master',
      icon: 'fas fa-medal',
      color: 'text-primary',
      locked: topicsCompleted < 10,
      progress: topicsCompleted >= 10 ? 'Unlocked' : `${topicsCompleted} / 10`
    });

    this.achievementsGrid.push({
      id: 'consistent',
      title: 'Consistent Learner',
      icon: 'fas fa-fire',
      color: 'text-orange',
      locked: this.weeklyTrend.length < 3,
      progress: this.weeklyTrend.length >= 3 ? 'Unlocked' : `${this.weeklyTrend.length} / 3 wks`
    });
  }

  private getRelativeTime(dateString: string): string {
    if (!dateString) return 'Recently';
    const actDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - actDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return actDate.toLocaleDateString();
  }

  private groupTimelineActivities() {
    this.groupedActivities = [];
    if (!this.activities || this.activities.length === 0) return;

    let practiceCount = 0;
    let completionCount = 0;
    let latestPracticeDate = '';
    let latestCompletionDate = '';

    this.activities.forEach(act => {
      if (act.type === 'practice') {
        practiceCount++;
        if (!latestPracticeDate || new Date(act.date) > new Date(latestPracticeDate)) latestPracticeDate = act.date as string;
      }
      if (act.type === 'completion') {
        completionCount++;
        if (!latestCompletionDate || new Date(act.date) > new Date(latestCompletionDate)) latestCompletionDate = act.date as string;
      }
    });

    if (completionCount > 0) {
      this.groupedActivities.push({
        icon: 'fas fa-book',
        bg: 'bg-light-primary text-primary',
        title: `Completed ${completionCount} Topics`,
        time: this.getRelativeTime(latestCompletionDate)
      });
    }

    if (practiceCount > 0) {
      this.groupedActivities.push({
        icon: 'fas fa-pen',
        bg: 'bg-light-success text-success',
        title: `Finished ${practiceCount} Practice Quizzes`,
        time: this.getRelativeTime(latestPracticeDate)
      });
    }

    if ((this.kpis?.readyForExam || 0) >= 80) { // Using readiness as a proxy
       this.groupedActivities.push({
        icon: 'fas fa-bullseye',
        bg: 'bg-light-danger text-danger',
        title: `Reached 80% Readiness!`,
        time: this.getRelativeTime(latestPracticeDate || latestCompletionDate)
      });
    }

    const recentSkill = this.skills.find(s => s.status === 'approved');
    if (recentSkill) {
      this.groupedActivities.push({
        icon: 'fas fa-star',
        bg: 'bg-light-warning text-warning',
        title: `Verified ${recentSkill.skill_name} Skill`,
        time: this.getRelativeTime(new Date().toISOString()) // Approximation for skill verify date if updated_at is missing
      });
    }
  }

  private initWeeklyTrendChart() {
    if (!this.weeklyTrend || this.weeklyTrend.length === 0) return;

    const sortedData = [...this.weeklyTrend].sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
    const categories = sortedData.map(item => {
      const d = new Date(item.week);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const accuracyData = sortedData.map(item => item.accuracy);
    const coverageData = sortedData.map(item => item.coverage);
    const readinessData = sortedData.map(item => item.readiness);

    this.areaChartOptions = {
      series: [
        {
          name: 'Readiness %',
          data: readinessData,
        },
        {
          name: 'Coverage %',
          data: coverageData,
        },
        {
          name: 'Accuracy %',
          data: accuracyData,
        }
      ],
      chart: {
        height: 250,
        type: 'area',
        toolbar: { show: false },
        foreColor: 'var(--bs-secondary-color)',
        sparkline: { enabled: false }
      },
      colors: ['var(--bs-primary)', 'var(--bs-info)', 'var(--bs-success)'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: categories, labels: { style: { fontSize: '10px' } } },
      yaxis: { show: false },
      grid: { show: false },
      legend: { show: true, position: 'top' },
    };
  }

  private initAttendanceChart() {
    this.attendanceChartOptions = {
      series: [this.attendance?.attendancePercentage || 0],
      chart: { height: 250, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          hollow: { size: '65%' },
          dataLabels: {
            name: { show: true, color: 'var(--bs-secondary-color)', fontSize: '14px' },
            value: { show: true, color: 'var(--bs-heading-color)', fontSize: '20px', formatter: (val) => val.toFixed(1) + "%" }
          }
        },
      },
      labels: ['Attendance'],
      colors: ['var(--bs-purple)'],
    };
  }

  private initRadialChart() {
    this.radialChartOptions = {
      series: [this.curriculumCompletionPercentage],
      chart: { height: 300, type: 'radialBar' },
      plotOptions: {
        radialBar: {
          hollow: { size: '70%' },
          dataLabels: {
            name: { show: true, color: 'var(--bs-secondary-color)', fontSize: '16px' },
            value: { show: true, color: 'var(--bs-heading-color)', fontSize: '24px', formatter: (val) => val.toFixed(1) + "%" }
          }
        },
      },
      labels: ['Completed'],
      colors: ['var(--bs-success)'],
    };
  }

  private initSkillsDonutChart() {
    this.skillsDonutChartOptions = {
      series: [this.verifiedSkillsCount, this.pendingSkillsCount],
      chart: { height: 180, type: 'donut' },
      labels: ['Verified', 'Pending'],
      colors: ['var(--bs-success)', 'var(--bs-warning)'],
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              value: { fontSize: '18px', fontWeight: 'bold' },
              total: { show: true, label: 'Total', fontSize: '14px', color: 'var(--bs-secondary-color)' }
            }
          }
        }
      }
    };
  }

  navigateToSkills() {
    this.router.navigate(['/student/skills']);
  }

  navigateToPractice() {
    this.router.navigate(['/student/practice']);
  }

  private initExamTrendChart() {
    if (!this.examAnalytics || !this.examAnalytics.history || this.examAnalytics.history.length === 0) {
      return;
    }

    const historyData = this.examAnalytics.history;
    const categories = historyData.map(h => h.examName);
    const dataPoints = historyData.map(h => h.percentage);

    this.examTrendChartOptions = {
      series: [
        {
          name: 'Percentage',
          data: dataPoints,
        }
      ],
      chart: {
        height: 250,
        type: 'area',
        toolbar: { show: false },
        foreColor: 'var(--bs-secondary-color)',
        sparkline: { enabled: false }
      },
      colors: ['#3b82f6'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: categories, labels: { style: { fontSize: '10px' } } },
      yaxis: { min: 0, max: 100, labels: { formatter: (val) => val.toFixed(0) + '%' } },
      grid: { borderColor: 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
      legend: { show: false },
    };
  }
}
