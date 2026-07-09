import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  NgApexchartsModule,
} from 'ng-apexcharts';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, PerformanceTrend } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

export type PerformanceTrendChartOptions = {
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
  selector: 'app-teacher-performance-trend',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent, NgApexchartsModule],
  templateUrl: './performance-trend.component.html'
})
export class PerformanceTrendComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart!: ChartComponent;
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  state: WidgetState = 'loading';
  performanceTrend: PerformanceTrend[] = [];
  chartOptions!: Partial<PerformanceTrendChartOptions>;

  ngOnInit(): void {
    this.sub.add(
      this.contextService.context$.subscribe(ctx => {
        this.loadData(ctx.sectionId, ctx.subjectId);
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadData(sectionId: string, subjectId?: string): void {
    this.state = 'loading';
    this.dashboardService.getPerformanceTrend(sectionId, subjectId).subscribe({
      next: (data) => {
        this.performanceTrend = data?.trend || [];
        this.initChart();
        this.state = this.performanceTrend.length === 0 ? 'empty' : 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  private initChart(): void {
    if (!this.performanceTrend || this.performanceTrend.length === 0) {
      this.chartOptions = {} as any;
      return;
    }

    const categories = this.performanceTrend.map(item => item.examName);
    const scores = this.performanceTrend.map(item => item.avgScore);

    this.chartOptions = {
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
}
