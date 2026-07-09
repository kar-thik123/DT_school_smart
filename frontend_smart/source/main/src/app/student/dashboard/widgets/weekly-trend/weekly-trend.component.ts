import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexDataLabels, ApexLegend, ApexGrid } from 'ng-apexcharts';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentKPIs, WeeklyTrend } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

export type areaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-weekly-trend',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, WidgetSkeletonComponent],
  templateUrl: './weekly-trend.component.html',
  styleUrls: ['./weekly-trend.component.scss']
})
export class WeeklyTrendComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  kpis: StudentKPIs | null = null;
  weeklyTrend: WeeklyTrend[] = [];
  public areaChartOptions!: Partial<areaChartOptions>;

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
        this.initChart();
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  private initChart() {
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
        { name: 'Readiness %', data: readinessData },
        { name: 'Coverage %', data: coverageData },
        { name: 'Accuracy %', data: accuracyData }
      ],
      chart: { height: 250, type: 'area', toolbar: { show: false }, foreColor: 'var(--bs-secondary-color)', sparkline: { enabled: false } },
      colors: ['var(--bs-primary)', 'var(--bs-info)', 'var(--bs-success)'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: categories, labels: { style: { fontSize: '10px' } } },
      yaxis: { show: false },
      grid: { show: false },
      legend: { show: true, position: 'top' },
    };
  }
}
