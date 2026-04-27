import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgxGaugeModule } from 'ngx-gauge';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

interface GaugeValues {
  [key: number]: number;
}

@Component({
    selector: 'app-gauge',
    templateUrl: './gauge.component.html',
    styleUrls: ['./gauge.component.scss'],
    imports: [
        BreadcrumbComponent,
        NgxGaugeModule,
        MatButtonModule,
    ]
})
export class GaugeComponent {
  breadscrums = [
    {
      title: 'Gauge',
      items: ['Charts'],
      active: 'Gauge',
    },
  ];

  gaugeValue = 68;
  gaugeSize = 120;
  guageThick = 5;

  dynamicGaugeDemoValue = 10.2;

  constructor() {
    this.percentageValue = function (value: number): string {
      return `${Math.round(value)}`;
    };
  }

  percentageValue: (value: number) => string;
  gaugeValues: GaugeValues = {
    1: 100,
    2: 50,
    3: 50,
    4: 50,
    5: 50,
    6: 50,
    7: 50,
  };

  onUpdateClick() {
    this.dynamicGaugeDemoValue = Math.round(Math.random() * 1000) / 10;
  }

  markerConfig = {
    '0': { color: '#555', size: 8, label: '0', type: 'line' },
    '15': { color: '#555', size: 4, type: 'line' },
    '30': { color: '#555', size: 8, label: '30', type: 'line' },
    '40': { color: '#555', size: 4, type: 'line' },
    '50': { color: '#555', size: 8, label: '50', type: 'line' },
    '60': { color: '#555', size: 4, type: 'line' },
    '70': { color: '#555', size: 8, label: '70', type: 'line' },
    '85': { color: '#555', size: 4, type: 'line' },
    '100': { color: '#555', size: 8, label: '100', type: 'line' },
  };
}
