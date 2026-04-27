import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TransportOverviewComponent } from '@shared/components/transport-overview/transport-overview.component';
import { NgApexchartsModule } from 'ng-apexcharts';

import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'app-transport-dashboard',
  imports: [
    BreadcrumbComponent,
    TransportOverviewComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    NgApexchartsModule,
    NgScrollbar
],
  templateUrl: './transport-dashboard.component.html',
  styleUrl: './transport-dashboard.component.scss',
})
export class TransportDashboardComponent implements OnInit {
  breadscrums = [
    {
      title: 'Transport Dashboad',
      items: [],
      active: 'Transport Dashboard',
    },
  ];

  // Chart options
  routeDistributionChartOptions: any;
  onTimePerformanceChartOptions: any;
  weeklyUsageChartOptions: any;
  routeCompletionChartOptions: any;

  // Vehicle status data
  vehicles = [
    {
      id: 'BUS-001',
      name: 'School Bus 1',
      status: 'active',
      driver: 'John Smith',
      location: 'North Route',
      lastUpdate: '2 mins ago',
      fuelLevel: 85,
    },
    {
      id: 'BUS-002',
      name: 'School Bus 2',
      status: 'maintenance',
      driver: 'Sarah Johnson',
      location: 'Garage',
      lastUpdate: '1 hour ago',
      fuelLevel: 45,
    },
    {
      id: 'VAN-001',
      name: 'Transport Van 1',
      status: 'active',
      driver: 'Mike Davis',
      location: 'East Route',
      lastUpdate: '5 mins ago',
      fuelLevel: 72,
    },
    {
      id: 'VAN-002',
      name: 'Transport Van 2',
      status: 'inactive',
      driver: 'Emily Wilson',
      location: 'School Parking',
      lastUpdate: '30 mins ago',
      fuelLevel: 65,
    },
  ];

  // Student transport data
  studentTransport = [
    {
      route: 'North Route',
      totalStudents: 42,
      presentToday: 38,
      absent: 4,
      specialNeeds: 3,
    },
    {
      route: 'South Route',
      totalStudents: 55,
      presentToday: 51,
      absent: 4,
      specialNeeds: 5,
    },
    {
      route: 'East Route',
      totalStudents: 38,
      presentToday: 35,
      absent: 3,
      specialNeeds: 2,
    },
    {
      route: 'West Route',
      totalStudents: 64,
      presentToday: 60,
      absent: 4,
      specialNeeds: 6,
    },
    {
      route: 'Central Route',
      totalStudents: 22,
      presentToday: 20,
      absent: 2,
      specialNeeds: 1,
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.initRouteDistributionChart();
    this.initOnTimePerformanceChart();
    this.initWeeklyUsageChart();
    this.initRouteCompletionChart();
  }

  initRouteDistributionChart(): void {
    this.routeDistributionChartOptions = {
      series: [
        {
          name: 'Students',
          data: [44, 55, 41, 64, 22],
        },
      ],
      chart: {
        type: 'bar',
        height: 250,
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: ['north', 'south', 'east', 'west', 'central'],
        labels: {
          style: {
            fontSize: '10px',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Students',
        },
        labels: {
          formatter: function (val: number) {
            return val.toFixed(0);
          },
        },
      },
      fill: {
        opacity: 1,
        colors: ['#2196F3'],
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' students';
          },
        },
      },
    };
  }

  initOnTimePerformanceChart(): void {
    this.onTimePerformanceChartOptions = {
      series: [92, 5, 3],
      chart: {
        type: 'donut',
        height: 250,
        foreColor: '#9aa0ac',
      },
      labels: ['On Time', 'Delayed', 'Missed'],
      colors: ['#4CAF50', '#FFC107', '#F44336'],
      legend: {
        position: 'bottom',
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
              },
              value: {
                show: true,
                formatter: function (val: number) {
                  return val.toFixed(1) + '%';
                },
              },
              total: {
                show: true,
                label: 'On Time',
                formatter: function () {
                  return '92.0%';
                },
              },
            },
          },
        },
      },
    };
  }

  initRouteCompletionChart(): void {
    this.routeCompletionChartOptions = {
      series: [
        {
          name: 'Completion Rate',
          data: [95, 88, 92, 85, 90],
        },
      ],
      chart: {
        height: 250,
        type: 'line',
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      colors: ['#6777ef'],
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(0) + '%';
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      xaxis: {
        categories: ['North', 'South', 'East', 'West', 'Central'],
      },
      yaxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Completion Rate (%)',
        },
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + '%';
          },
        },
      },
    };
  }

  initWeeklyUsageChart(): void {
    this.weeklyUsageChartOptions = {
      series: [
        {
          name: 'Morning',
          data: [310, 315, 305, 312, 308, 120, 0],
        },
        {
          name: 'Afternoon',
          data: [290, 295, 285, 292, 288, 110, 0],
        },
      ],
      chart: {
        type: 'area',
        height: 250,
        toolbar: {
          show: false,
        },
        stacked: false,
        foreColor: '#9aa0ac',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      yaxis: {
        title: {
          text: 'Students',
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        },
      },
      colors: ['#2196F3', '#FF9800'],
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val + ' students';
          },
        },
      },
    };
  }
}
