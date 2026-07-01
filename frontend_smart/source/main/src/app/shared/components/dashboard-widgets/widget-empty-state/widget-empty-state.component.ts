import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-empty-state.component.html',
  styleUrls: ['./widget-empty-state.component.scss']
})
export class WidgetEmptyStateComponent {
  @Input() message: string = 'No data available';
  @Input() icon: string = 'inbox';
}
