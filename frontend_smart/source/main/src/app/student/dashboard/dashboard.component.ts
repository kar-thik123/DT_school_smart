import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
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
    MatButtonModule
  ],
})
export class DashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public areaChartOptions!: Partial<areaChartOptions>;
  public radialChartOptions!: Partial<radialChartOptions>;
  public skillsDonutChartOptions!: Partial<skillsDonutChartOptions>;

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

  // Derived KPIs
  curriculumCompletionPercentage: number = 0;
  verifiedSkillsCount: number = 0;
  pendingSkillsCount: number = 0;

  // New Dashboard Home States
  heroState: any = null;
  
  // KPI Trends
  accuracyTrendDiff: number = 0;
  questionsTrendDiff: number = 0;
  skillsTrendText: string = '+1 newly approved'; // Dynamic based on recent

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
        this.activities = data.activities || [];
        
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
        subject: activeSubject.subject_name,
        topic: currentTopic,
        progress: `${activeSubject.completed_topics} of ${activeSubject.completed_topics + activeSubject.pending_topics} Topics Completed`,
        percentage: activeSubject.completed_topics > 0 ? ((activeSubject.completed_topics / (activeSubject.completed_topics + activeSubject.pending_topics)) * 100).toFixed(0) : 0
      };
    } else {
      this.heroState = { subject: 'Introduction', topic: 'Getting Started', progress: '0 of 1 Topics Completed', percentage: 0 };
    }
  }

  private computeTrendsAndGrowth() {
    if (this.weeklyTrend && this.weeklyTrend.length >= 2) {
      const sortedData = [...this.weeklyTrend].sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime());
      const last = sortedData[sortedData.length - 1];
      const prev = sortedData[sortedData.length - 2];
      const first = sortedData[0];

      this.accuracyTrendDiff = last.overall_accuracy - prev.overall_accuracy;
      this.questionsTrendDiff = last.total_questions - prev.total_questions;
      
      this.questionsThisWeek = last.total_questions;
      this.accuracyThisWeek = last.overall_accuracy;
      
      const overallDiff = last.overall_accuracy - first.overall_accuracy;
      if (overallDiff > 0) {
        this.improvementText = `You improved ${overallDiff.toFixed(1)}% compared to your first week.`;
      } else {
        this.improvementText = `Stay consistent to see long-term improvement!`;
      }
    } else {
      this.accuracyTrendDiff = 0;
      this.questionsTrendDiff = 0;
      this.improvementText = 'Keep practicing to unlock insights.';
    }

    if (this.subjects && this.subjects.length > 0) {
      const best = [...this.subjects].sort((a, b) => b.practice_accuracy - a.practice_accuracy)[0];
      this.bestSubject = best.subject_name;
    }
  }

  private buildActionCenter() {
    this.actionableTasks = [];
    
    if (this.subjects.length > 0) {
      const weakest = [...this.subjects].sort((a, b) => a.practice_accuracy - b.practice_accuracy)[0];
      this.actionableTasks.push({
        priority: '🔥 Recommended',
        icon: 'fas fa-book-open',
        title: `Continue ${weakest.subject_name}`,
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
    const acc = this.kpis?.practice_accuracy || 0;
    const qAttempted = this.kpis?.questions_attempted || 0;

    this.achievementsGrid.push({
      id: 'acc_champ',
      title: 'Accuracy Champion',
      icon: 'fas fa-trophy',
      color: 'text-warning',
      locked: acc < 80,
      progress: acc >= 80 ? 'Unlocked' : `${acc.toFixed(0)}% / 80%`
    });

    this.achievementsGrid.push({
      id: 'century',
      title: 'Century Club',
      icon: 'fas fa-bullseye',
      color: 'text-danger',
      locked: qAttempted < 100,
      progress: qAttempted >= 100 ? 'Unlocked' : `${qAttempted} / 100`
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

    if ((this.kpis?.questions_attempted || 0) >= 100) {
       this.groupedActivities.push({
        icon: 'fas fa-bullseye',
        bg: 'bg-light-danger text-danger',
        title: `Reached 100 Questions Solved!`,
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

    const sortedData = [...this.weeklyTrend].sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime());
    const categories = sortedData.map(item => {
      const d = new Date(item.week_start);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const accuracyData = sortedData.map(item => item.overall_accuracy);

    this.areaChartOptions = {
      series: [
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
      colors: ['var(--bs-primary)'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: categories, labels: { style: { fontSize: '10px' } } },
      yaxis: { show: false },
      grid: { show: false },
      legend: { show: false },
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
}
