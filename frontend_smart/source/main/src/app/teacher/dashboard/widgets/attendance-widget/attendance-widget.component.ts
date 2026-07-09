import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  NgApexchartsModule,
} from 'ng-apexcharts';

import { DashboardWidgetWrapperComponent, WidgetState } from '../../../../shared/components/dashboard-widgets/dashboard-widget-wrapper/dashboard-widget-wrapper.component';
import { TeacherDashboardService, SummaryStats } from '../../teacher-dashboard.service';
import { TeacherDashboardContextService } from '../../teacher-dashboard-context.service';

export type RadialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
};

@Component({
  selector: 'app-teacher-attendance-widget',
  standalone: true,
  imports: [CommonModule, DashboardWidgetWrapperComponent, NgApexchartsModule],
  templateUrl: './attendance-widget.component.html'
})
export class AttendanceWidgetComponent implements OnInit, OnDestroy {
  private dashboardService = inject(TeacherDashboardService);
  public contextService = inject(TeacherDashboardContextService);
  private sub = new Subscription();

  state: WidgetState = 'loading';
  summaryStats: SummaryStats | null = null;
  chartOptions!: Partial<RadialChartOptions>;

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
    this.dashboardService.getSummaryStats(sectionId, subjectId).subscribe({
      next: (data) => {
        this.summaryStats = data;
        this.initChart();
        this.state = 'success';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  private initChart(): void {
    this.chartOptions = {
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
}
