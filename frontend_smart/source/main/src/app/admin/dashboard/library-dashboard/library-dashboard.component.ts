import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// ApexCharts
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexGrid,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
  ApexResponsive,
  ApexNonAxisChartSeries,
  NgApexchartsModule,
  ChartComponent,
} from 'ng-apexcharts';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgScrollbar } from 'ngx-scrollbar';

// Chart Options Types
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  colors: string[];
  grid: ApexGrid;
  title?: { text: string };
  labels?: string[];
};

export type RadialBarChartOptions = {
  series: ApexNonAxisChartSeries; // Change to `number[]`
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  colors: string[];
  labels: string[];
  tooltip?: ApexTooltip;
};

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  responsive: ApexResponsive[];
  colors: string[];
  labels: string[];
};

@Component({
  selector: 'app-library-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    MatProgressBarModule,
    NgScrollbar,
  ],
  templateUrl: './library-dashboard.component.html',
  styleUrl: './library-dashboard.component.scss',
})
export class LibraryDashboardComponent implements OnInit {
  @ViewChild('issueChart') issueChart!: ChartComponent;
  @ViewChild('genreChart') genreChart!: ChartComponent;
  @ViewChild('memberChart') memberChart!: ChartComponent;
  @ViewChild('topBooksChart') topBooksChart!: ChartComponent;
  @ViewChild('statsChart') statsChart!: ChartComponent;
  @ViewChild('heatmapChart') heatmapChart!: ChartComponent;
  @ViewChild('usageChart') usageChart!: ChartComponent;

  breadscrums = [
    {
      title: 'Library Dashboard',
      items: [],
      active: 'Library Dashboard',
    },
  ];

  // Chart Options
  public issueChartOptions!: Partial<ChartOptions>;
  public genreChartOptions!: Partial<PieChartOptions>;
  public memberChartOptions!: Partial<ChartOptions>;
  public libraryStatsChartOptions!: Partial<ChartOptions>;
  public heatmapChartOptions!: Partial<ChartOptions>;
  public usageChartOptions!: Partial<RadialBarChartOptions>;

  // Library Statistics
  libraryStats = {
    totalBooks: 5842,
    totalBooksProgress: 12,
    booksIssued: 1245,
    booksIssuedProgress: 21,
    activeMembers: 842,
    activeMembersProgress: 76,
    overdueBooks: 68,
    overdueBooksProgress: 5,
  };

  // Tables Data
  recentIssuedBooks: any[] = [];
  overdueBooks: any[] = [];
  newlyAddedBooks: any[] = [];

  // Filter values
  dateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };

  // Filter options
  genres: string[] = [
    'All',
    'Fiction',
    'Non-Fiction',
    'Science',
    'History',
    'Biography',
    'Fantasy',
    'Self-Help',
  ];
  authors: string[] = [
    'All',
    'J.K. Rowling',
    'Stephen King',
    'James Clear',
    'Michelle Obama',
    'Yuval Noah Harari',
  ];
  availabilityOptions: string[] = ['All', 'Available', 'Issued', 'Reserved'];

  // Calendar reminders
  reminders: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.initCharts();
    this.loadTableData();
    this.loadReminders();
  }

  // Initialize all charts
  private initCharts(): void {
    this.initIssueChart();
    this.initGenreChart();
    this.initMemberChart();
    this.initLibraryStatsChart();
    this.initHeatmapChart();
    this.initUsageChart();
  }

  // Book Borrowing Patterns Heatmap
  initHeatmapChart(): void {
    this.heatmapChartOptions = {
      series: [
        {
          name: 'Fiction',
          data: this.generateHeatmapData(30, 60),
        },
        {
          name: 'Non-Fiction',
          data: this.generateHeatmapData(20, 50),
        },
        {
          name: 'Science',
          data: this.generateHeatmapData(15, 40),
        },
        {
          name: 'History',
          data: this.generateHeatmapData(10, 35),
        },
        {
          name: 'Biography',
          data: this.generateHeatmapData(5, 30),
        },
        {
          name: 'Self-Help',
          data: this.generateHeatmapData(25, 45),
        },
        {
          name: 'Fantasy',
          data: this.generateHeatmapData(35, 65),
        },
      ],
      chart: {
        height: 350,
        type: 'heatmap',
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
        foreColor: '#9aa0ac',
      },
      dataLabels: {
        enabled: false,
      },
      colors: ['#008FFB'],
      title: {
        text: '',
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          radius: 0,
          useFillColorAsStroke: false,
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 10,
                name: 'Low',
                color: '#ebf5ff',
              },
              {
                from: 11,
                to: 30,
                name: 'Medium',
                color: '#89c4ff',
              },
              {
                from: 31,
                to: 50,
                name: 'High',
                color: '#2196F3',
              },
              {
                from: 51,
                to: 100,
                name: 'Very High',
                color: '#0069c0',
              },
            ],
          },
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + ' books';
          },
        },
      },
      xaxis: {
        type: 'category',
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: {
          style: {
            colors: [],
            fontSize: '12px',
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          },
        },
        axisBorder: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: [],
            fontSize: '12px',
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          },
        },
      },
    };
  }

  // Generate random data for heatmap
  generateHeatmapData(min: number, max: number): any[] {
    const data = [];
    for (let i = 0; i < 7; i++) {
      data.push({
        x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        y: Math.floor(Math.random() * (max - min + 1)) + min,
      });
    }
    return data;
  }

  // Library Usage Metrics Chart (Radial Bar Chart)
  initUsageChart(): void {
    this.usageChartOptions = {
      series: [76, 83, 65, 91, 58],
      chart: {
        height: 350,
        type: 'radialBar',
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: {
            margin: 5,
            size: '30%',
            background: 'transparent',
            image: undefined,
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: '#666',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '22px',
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 600,
              color: undefined,
              offsetY: 0,
              formatter: function (val) {
                return val + '%';
              },
            },
            total: {
              show: true,
              label: 'Overall',
              formatter: function () {
                return '75%';
              },
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Roboto, sans-serif',
              color: '#666',
            },
          },
          track: {
            show: true,
            background: '#f2f2f2',
            strokeWidth: '97%',
            opacity: 1,
            margin: 5,
            dropShadow: {
              enabled: false,
            },
          },
        },
      },
      colors: ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336'],
      labels: [
        'Circulation Rate',
        'Member Engagement',
        'Collection Usage',
        'Digital Access',
        'Program Attendance',
      ],
      stroke: {
        lineCap: 'round',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: [
            '#8BC34A',
            '#03A9F4',
            '#CE93D8',
            '#FFB74D',
            '#EF5350',
          ],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      tooltip: {
        enabled: true,
      },
    };
  }

  // Library Statistics Chart (Bar Chart)
  initLibraryStatsChart(): void {
    this.libraryStatsChartOptions = {
      series: [
        {
          name: 'Available',
          data: [1840, 950, 1100, 1200, 780, 940],
        },
        {
          name: 'Issued',
          data: [400, 200, 350, 300, 150, 230],
        },
        {
          name: 'Reserved',
          data: [120, 80, 100, 90, 50, 70],
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5,
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: ['#4CAF50', '#2196F3', '#FF9800'],
      xaxis: {
        type: 'category',
        categories: [
          'Fiction',
          'Non-Fiction',
          'Science',
          'History',
          'Biography',
          'Self-Help',
        ],
      },
      yaxis: {
        title: {
          text: 'Number of Books',
        },
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetY: 0,
      },
    };
  }

  // Books Issued Over Time (Line Chart)
  initIssueChart(): void {
    this.issueChartOptions = {
      series: [
        {
          name: 'Books Issued',
          data: [31, 40, 28, 51, 42, 82, 56, 45, 60, 54, 62, 68],
        },
        {
          name: 'Books Returned',
          data: [25, 35, 26, 45, 40, 60, 58, 40, 53, 50, 58, 65],
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
      colors: ['#4CAF50', '#2196F3'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      xaxis: {
        type: 'category',
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm',
        },
      },
      grid: {
        show: true,
        borderColor: '#9aa0ac',
        strokeDashArray: 1,
      },
    };
  }

  // Genre-wise Distribution (Donut Chart)
  initGenreChart(): void {
    this.genreChartOptions = {
      series: [44, 55, 13, 43, 22, 18],
      chart: {
        type: 'donut',
        height: 350,
      },
      labels: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'History',
        'Biography',
        'Self-Help',
      ],
      colors: [
        '#4CAF50',
        '#2196F3',
        '#FFC107',
        '#FF5722',
        '#9C27B0',
        '#3F51B5',
      ],
      legend: {
        position: 'bottom',
      },
      dataLabels: {
        enabled: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };
  }

  // Monthly New Members (Bar Chart)
  initMemberChart(): void {
    this.memberChartOptions = {
      series: [
        {
          name: 'New Members',
          data: [20, 34, 27, 56, 47, 44, 55, 58, 32, 35, 47, 50],
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
        },
        foreColor: '#9aa0ac',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5,
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
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
      fill: {
        opacity: 1,
      },
      colors: ['#64c248ff'],
      tooltip: {
        y: {
          formatter: function (val) {
            return val + ' members';
          },
        },
      },
    };
  }

  // Load table data
  loadTableData(): void {
    // Recent Issued Books
    this.recentIssuedBooks = [
      {
        title: 'Atomic Habits',
        member: 'John Smith',
        issueDate: '2023-06-15',
        dueDate: '2023-06-29',
        status: 'Active',
      },
      {
        title: 'The Psychology of Money',
        member: 'Emma Johnson',
        issueDate: '2023-06-14',
        dueDate: '2023-06-28',
        status: 'Active',
      },
      {
        title: 'Sapiens',
        member: 'Michael Brown',
        issueDate: '2023-06-12',
        dueDate: '2023-06-26',
        status: 'Active',
      },
      {
        title: "Harry Potter and the Philosopher's Stone",
        member: 'Sarah Wilson',
        issueDate: '2023-06-10',
        dueDate: '2023-06-24',
        status: 'Active',
      },
      {
        title: 'To Kill a Mockingbird',
        member: 'David Lee',
        issueDate: '2023-06-08',
        dueDate: '2023-06-22',
        status: 'Active',
      },
      {
        title: 'Deep Work',
        member: 'Olivia Martin',
        issueDate: '2023-06-13',
        dueDate: '2023-06-27',
        status: 'Active',
      },
      {
        title: 'Educated',
        member: 'Liam Davis',
        issueDate: '2023-06-11',
        dueDate: '2023-06-25',
        status: 'Active',
      },
      {
        title: 'The Subtle Art of Not Giving a F*ck',
        member: 'Sophia Garcia',
        issueDate: '2023-06-09',
        dueDate: '2023-06-23',
        status: 'Active',
      },
      {
        title: '1984',
        member: 'James Anderson',
        issueDate: '2023-06-07',
        dueDate: '2023-06-21',
        status: 'Active',
      },
    ];

    // Overdue Books
    this.overdueBooks = [
      {
        title: 'The Great Gatsby',
        borrower: 'Robert Taylor',
        daysOverdue: 12,
        contact: 'robert.taylor@example.com',
      },
      {
        title: '1984',
        borrower: 'Jennifer Davis',
        daysOverdue: 8,
        contact: 'jennifer.davis@example.com',
      },
      {
        title: 'Pride and Prejudice',
        borrower: 'Thomas Wilson',
        daysOverdue: 5,
        contact: 'thomas.wilson@example.com',
      },
      {
        title: 'The Alchemist',
        borrower: 'Lisa Anderson',
        daysOverdue: 3,
        contact: 'lisa.anderson@example.com',
      },
      {
        title: 'Brave New World',
        borrower: 'Daniel Martinez',
        daysOverdue: 10,
        contact: 'daniel.martinez@example.com',
      },
      {
        title: 'Moby Dick',
        borrower: 'Emily Thompson',
        daysOverdue: 6,
        contact: 'emily.thompson@example.com',
      },
      {
        title: 'The Catcher in the Rye',
        borrower: 'Anthony Harris',
        daysOverdue: 14,
        contact: 'anthony.harris@example.com',
      },
      {
        title: 'The Hobbit',
        borrower: 'Natalie Clark',
        daysOverdue: 9,
        contact: 'natalie.clark@example.com',
      },
    ];

    // Newly Added Books
    this.newlyAddedBooks = [
      {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        genre: 'Fiction',
        addedDate: '2023-06-14',
      },
      {
        title: 'Educated',
        author: 'Tara Westover',
        genre: 'Biography',
        addedDate: '2023-06-12',
      },
      {
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        genre: 'Thriller',
        addedDate: '2023-06-10',
      },
      {
        title: 'Becoming',
        author: 'Michelle Obama',
        genre: 'Biography',
        addedDate: '2023-06-08',
      },
      {
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        addedDate: '2023-06-06',
      },
      {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        genre: 'Science Fiction',
        addedDate: '2023-06-04',
      },
      {
        title: 'Where the Crawdads Sing',
        author: 'Delia Owens',
        genre: 'Mystery',
        addedDate: '2023-06-02',
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        genre: 'Self-help',
        addedDate: '2023-05-31',
      },
      {
        title: 'The Four Agreements',
        author: 'Don Miguel Ruiz',
        genre: 'Spirituality',
        addedDate: '2023-05-29',
      },
    ];
  }

  // Load calendar reminders
  loadReminders(): void {
    this.reminders = [
      {
        title: 'Return Reminder: The Great Gatsby',
        date: '2023-06-18',
        student: 'Robert Taylor',
        type: 'overdue',
      },
      {
        title: 'Book Reservation: Atomic Habits',
        date: '2023-06-20',
        student: 'Alice Johnson',
        type: 'reservation',
      },
      {
        title: 'Return Reminder: 1984',
        date: '2023-06-22',
        student: 'Jennifer Davis',
        type: 'overdue',
      },
      {
        title: 'Book Reservation: Sapiens',
        date: '2023-06-25',
        student: 'William Brown',
        type: 'reservation',
      },
      {
        title: 'Return Reminder: Pride and Prejudice',
        date: '2023-06-27',
        student: 'Thomas Wilson',
        type: 'overdue',
      },
      {
        title: 'Return Reminder: The Alchemist',
        date: '2023-06-28',
        student: 'Lisa Anderson',
        type: 'overdue',
      },
      {
        title: 'Book Reservation: The Midnight Library',
        date: '2023-06-30',
        student: 'Emma Green',
        type: 'reservation',
      },
      {
        title: 'Return Reminder: Brave New World',
        date: '2023-07-01',
        student: 'Daniel Martinez',
        type: 'overdue',
      },
      {
        title: 'Book Reservation: Becoming',
        date: '2023-07-03',
        student: 'Noah Carter',
        type: 'reservation',
      },
    ];
  }
}
