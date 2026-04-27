import { Component } from '@angular/core';
import { Color, ScaleType, PieChartModule } from '@swimlane/ngx-charts';
import { FeatherIconsComponent } from '@shared/components/feather-icons/feather-icons.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-attendance-detail',
    templateUrl: './attendance-detail.component.html',
    styleUrls: ['./attendance-detail.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatTabsModule,
        MatIconModule,
        MatButtonModule,
        FeatherIconsComponent,
        PieChartModule,
    ]
})
export class AttendanceDetailComponent {
  gradient = false;
  showLegend = true;
  legendPosition = 'right';
  view: number[] = [500, 400];
  colorScheme: Color = {
    domain: ['#9370DB', '#87CEFA', '#FA8072', '#FF7F50', '#90EE90', '#9370DB'],
    group: ScaleType.Ordinal,
    selectable: true,
    name: 'Customer Usage',
  };
  showLabels = true;
  // data goes here
  public single = [
    {
      name: 'Present',
      value: 42,
    },
    {
      name: 'On Duty',
      value: 2,
    },
    {
      name: 'Paid Leave',
      value: 5,
    },
    {
      name: 'Absent',
      value: 1,
    },
    {
      name: 'Holiday Leave',
      value: 3,
    },
    {
      name: 'Weekend',
      value: 0,
    },
  ];
}
