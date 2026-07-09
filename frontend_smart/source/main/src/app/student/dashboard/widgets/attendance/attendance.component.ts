import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexNonAxisChartSeries, ApexChart, ApexPlotOptions } from 'ng-apexcharts';
import { StudentDashboardService } from '../../dashboard.service';
import { AttendanceSummary } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

export type radialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
};

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, WidgetSkeletonComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  attendance: AttendanceSummary | null = null;
  public attendanceChartOptions!: Partial<radialChartOptions>;

  constructor(private dashboardService: StudentDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    this.dashboardService.getAttendance().subscribe({
      next: (data) => {
        this.attendance = data;
        this.initChart();
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  private initChart() {
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
}
