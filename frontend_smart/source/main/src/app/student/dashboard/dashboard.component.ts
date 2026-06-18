import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { NgScrollbar } from 'ngx-scrollbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { StudentDashboardService } from './dashboard.service';
import {
  StudentOverview,
  StudentKPIs,
  SubjectPerformance,
  WeeklyTrend,
  CurriculumProgress,
  TeacherAssignment,
  TimelineActivity,
  StudentSkill
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

interface Achievement {
  title: string;
  icon: string;
  colorClass: string;
  conditionMet: boolean;
}

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
    NgScrollbar,
    MatButtonModule
  ],
})
export class DashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public areaChartOptions!: Partial<areaChartOptions>;
  public radialChartOptions!: Partial<radialChartOptions>;

  breadscrums = [
    {
      title: 'Dashboard',
      items: ['Student'],
      active: 'Dashboard',
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
  mappedCurriculum: any[] = [];
  teachers: TeacherAssignment[] = [];
  mappedTeachers: any[] = [];
  activities: TimelineActivity[] = [];

  // Derived KPIs
  subjectsAttempted: number = 0;
  topicsCompleted: number = 0;
  pendingTopics: number = 0;
  curriculumCompletionPercentage: number = 0;
  weeklyTrendSubtitle: string = '';
  achievements: Achievement[] = [];

  // New State Variables
  notifications: TimelineActivity[] = [];
  hasPracticePermission: boolean = true;
  isEnrolled: boolean = true;
  notEnrolledInActiveYear: boolean = false;
  skills: StudentSkill[] = [];
  verifiedSkillsCount: number = 0;
  pendingSkillsCount: number = 0;

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
          activities: this.dashboardService.getActivities().pipe(catchError(() => of([])))
        });
      })
    ).subscribe({
      next: (data: any) => {
        this.overview = data.overview;
        this.kpis = data.kpis;
        this.subjects = data.subjects || [];
        this.weeklyTrend = data.weeklyTrend || [];
        this.curriculum = data.curriculum || [];
        this.teachers = data.teachers || [];
        this.skills = data.skills || [];
        const allActivities = data.activities || [];
        
        // Permission & State Tracking
        this.hasPracticePermission = this.kpis !== null;
        this.isEnrolled = !!(this.overview && (this.overview.grade || this.overview.last_enrollment));
        this.notEnrolledInActiveYear = !!(this.overview && !this.overview.grade);

        // Skills logic
        this.verifiedSkillsCount = this.skills.filter((s: StudentSkill) => s.status === 'approved').length;
        this.pendingSkillsCount = this.skills.filter((s: StudentSkill) => s.status === 'pending').length;

        // Activity Filtering
        this.notifications = allActivities
          .filter((a: any) => a.type === 'notification')
          .slice(0, 5);

        this.activities = allActivities
          .filter((a: any) => ['practice', 'completion', 'skill', 'notification'].includes(a.type))
          .slice(0, 10);
        
        // Derived KPIs
        this.subjectsAttempted = this.subjects.length;
        this.topicsCompleted = this.curriculum.reduce((sum, c) => sum + c.topics_completed, 0);
        this.pendingTopics = this.curriculum.reduce((sum, c) => sum + (c.topics_total - c.topics_completed), 0);
        
        const totalTopics = this.topicsCompleted + this.pendingTopics;
        this.curriculumCompletionPercentage = totalTopics > 0 ? (this.topicsCompleted / totalTopics) * 100 : 0;

        // Achievements Logic
        this.achievements = [];
        if (this.kpis) {
          if (this.kpis.practice_accuracy >= 90) {
            this.achievements.push({ title: 'Top Performer', icon: 'fas fa-crown', colorClass: 'text-warning', conditionMet: true });
          } else if (this.kpis.practice_accuracy >= 80) {
            this.achievements.push({ title: 'Accuracy Champion', icon: 'fas fa-bullseye', colorClass: 'text-danger', conditionMet: true });
          }

          if (this.kpis.questions_attempted >= 50) {
            this.achievements.push({ title: 'Relentless Learner', icon: 'fas fa-book-reader', colorClass: 'text-primary', conditionMet: true });
          }

          if (this.kpis.skills_completion > 0) {
            this.achievements.push({ title: 'Skill Builder', icon: 'fas fa-star', colorClass: 'text-warning', conditionMet: true });
          }

          if (this.curriculumCompletionPercentage >= 75) {
            this.achievements.push({ title: 'Curriculum Master', icon: 'fas fa-trophy', colorClass: 'text-success', conditionMet: true });
          }
        }

        // Map Teachers to schedule format to reuse app-emp-schedule
        this.mappedTeachers = this.teachers.map((t, index) => ({
          name: t.teacher_name,
          degree: t.assigned_subjects.join(', '),
          date: t.official_email || 'No Email',
          time: '',
          imageUrl: `assets/images/user/user${(index % 6) + 1}.jpg`
        }));

        
        // Map CurriculumProgress to Course format for app-course-progress
        this.mappedCurriculum = this.curriculum.map((c, idx) => ({
          id: idx,
          name: c.subject_name,
          instructor: 'Assigned Teacher',
          progress: c.completion_percentage,
          totalModules: c.topics_total,
          completedModules: c.topics_completed,
          grade: 'N/A',
          lastAccessed: new Date().toISOString()
        }));

        this.initWeeklyTrendChart();
        this.initRadialChart();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.error = 'Unable to load dashboard data.';
        this.loading = false;
      }
    });
  }

  private initWeeklyTrendChart() {
    // Check if we have trend data
    if (!this.weeklyTrend || this.weeklyTrend.length === 0) {
      this.weeklyTrendSubtitle = "Start practicing to unlock your learning insights.";
      return;
    }

    // Sort by week start if not already sorted
    const sortedData = [...this.weeklyTrend].sort((a, b) => 
      new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
    );

    // Calculate trend difference
    if (sortedData.length >= 2) {
      const lastWeek = sortedData[sortedData.length - 2].overall_accuracy;
      const thisWeek = sortedData[sortedData.length - 1].overall_accuracy;
      const diff = thisWeek - lastWeek;
      if (diff > 0) {
        this.weeklyTrendSubtitle = `You improved ${diff.toFixed(1)}% this week 🎉`;
      } else if (diff < 0) {
        this.weeklyTrendSubtitle = `You dropped ${Math.abs(diff).toFixed(1)}% this week. Keep practicing!`;
      } else {
        this.weeklyTrendSubtitle = `Consistent performance this week!`;
      }
    } else {
      this.weeklyTrendSubtitle = `Great start! Keep practicing to see your trend.`;
    }

    const categories = sortedData.map(item => {
      const d = new Date(item.week_start);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const accuracyData = sortedData.map(item => item.overall_accuracy);
    const questionsData = sortedData.map(item => item.total_questions);

    this.areaChartOptions = {
      series: [
        {
          name: 'Overall Accuracy %',
          data: accuracyData,
        },
        {
          name: 'Total Questions',
          data: questionsData,
        },
      ],
      chart: {
        height: 350,
        type: 'area',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      colors: ['#F77A9A', '#A054F7'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
      },
      xaxis: {
        categories: categories,
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        offsetX: 0,
        offsetY: 0,
      },
    };
  }

  private initRadialChart() {
    this.radialChartOptions = {
      series: [this.curriculumCompletionPercentage],
      chart: {
        height: 300,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '70%',
          },
          dataLabels: {
            name: {
              show: true,
              color: '#888',
              fontSize: '16px'
            },
            value: {
              show: true,
              color: '#111',
              fontSize: '24px',
              formatter: function (val) {
                return val.toFixed(1) + "%";
              }
            }
          }
        },
      },
      labels: ['Completed'],
      colors: ['#4caf50'],
    };
  }

  navigateToPractice(subjectId?: string) {
    // Optional parameter for subject-specific practice routing
    this.router.navigate(['/student/practice']);
  }

  navigateToSkills() {
    this.router.navigate(['/student/skills']);
  }

  navigateToNotifications() {
    this.router.navigate(['/student/notifications']);
  }

  // Format activity icons based on type
  getActivityIcon(type: string): string {
    switch (type) {
      case 'practice': return 'edit';
      case 'completion': return 'check_circle';
      case 'skill': return 'stars';
      case 'notification': return 'notifications';
      default: return 'info';
    }
  }

  getActivityColorClass(type: string): string {
    switch (type) {
      case 'practice': return 'bg-blue';
      case 'completion': return 'bg-green';
      case 'skill': return 'bg-orange';
      case 'notification': return 'bg-purple';
      default: return 'bg-cyan';
    }
  }
}

