import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexDataLabels, ApexLegend, ApexGrid } from 'ng-apexcharts';
import { StudentDashboardService } from '../../dashboard.service';
import { ExaminationAnalyticsResponse } from '../../dashboard.model';
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
  selector: 'app-examination-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, WidgetSkeletonComponent],
  templateUrl: './examination-analytics.component.html',
  styleUrls: ['./examination-analytics.component.scss']
})
export class ExaminationAnalyticsComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  examAnalytics: ExaminationAnalyticsResponse | null = null;
  public examTrendChartOptions!: Partial<areaChartOptions>;

  constructor(private dashboardService: StudentDashboardService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    this.dashboardService.getExaminationAnalytics().subscribe({
      next: (data) => {
        this.examAnalytics = data;
        this.initExamTrendChart();
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
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
