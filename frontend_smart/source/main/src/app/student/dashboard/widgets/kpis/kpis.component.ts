import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentKPIs, WeeklyTrend } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './kpis.component.html',
  styleUrls: ['./kpis.component.scss']
})
export class KpisComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  kpis: StudentKPIs | null = null;
  weeklyTrend: WeeklyTrend[] = [];

  readinessTrendDiff: number = 0;
  coverageTrendDiff: number = 0;

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

  constructor(private dashboardService: StudentDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    forkJoin({
      kpis: this.dashboardService.getKPIs().pipe(catchError(() => of(null))),
      weeklyTrend: this.dashboardService.getWeeklyTrend().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        this.kpis = data.kpis;
        this.weeklyTrend = data.weeklyTrend || [];
        this.computeTrends();
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  private computeTrends() {
    if (this.weeklyTrend && this.weeklyTrend.length >= 2) {
      const sortedData = [...this.weeklyTrend].sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
      const last = sortedData[sortedData.length - 1];
      const prev = sortedData[sortedData.length - 2];
      this.readinessTrendDiff = last.readiness - prev.readiness;
      this.coverageTrendDiff = last.coverage - prev.coverage;
    } else {
      this.readinessTrendDiff = 0;
      this.coverageTrendDiff = 0;
    }
  }
}
