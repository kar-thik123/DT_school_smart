import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-skeleton.component.html',
  styleUrls: ['./widget-skeleton.component.scss']
})
export class WidgetSkeletonComponent {
  @Input() type: 'kpi' | 'chart' | 'list' | 'banner' = 'kpi';
}
