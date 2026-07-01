import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-list-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-list-card.component.html',
  styleUrls: ['./dashboard-list-card.component.scss']
})
export class DashboardListCardComponent {
  @Input() title: string = '';
}
