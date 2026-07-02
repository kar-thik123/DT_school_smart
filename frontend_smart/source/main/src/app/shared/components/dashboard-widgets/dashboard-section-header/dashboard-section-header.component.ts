import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-section-header.component.html',
  styleUrls: ['./dashboard-section-header.component.scss']
})
export class DashboardSectionHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}
