import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentKPIs, CurriculumProgress, WeeklyTrend } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss']
})
export class AchievementsComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  achievementsGrid: any[] = [];
  kpis: StudentKPIs | null = null;
  curriculum: CurriculumProgress[] = [];
  weeklyTrend: WeeklyTrend[] = [];
  showAllAchievements = false;

  constructor(private dashboardService: StudentDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    forkJoin({
      kpis: this.dashboardService.getKPIs().pipe(catchError(() => of(null))),
      curriculum: this.dashboardService.getCurriculumProgress().pipe(catchError(() => of([]))),
      weeklyTrend: this.dashboardService.getWeeklyTrend().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        this.kpis = data.kpis;
        this.curriculum = data.curriculum;
        this.weeklyTrend = data.weeklyTrend;
        const topicsCompleted = this.curriculum.reduce((sum, c) => sum + c.topics_completed, 0);
        this.buildAchievementsEngine(topicsCompleted);
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  toggleAchievements() {
    this.showAllAchievements = !this.showAllAchievements;
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
}
