import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-chart-card.component.html',
  styleUrls: ['./dashboard-chart-card.component.scss']
})
export class DashboardChartCardComponent {
  @Input() title: string = '';
}
