import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-kpi-card.component.html',
  styleUrls: ['./dashboard-kpi-card.component.scss']
})
export class DashboardKpiCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() iconClass: string = 'bg-blue';
}
