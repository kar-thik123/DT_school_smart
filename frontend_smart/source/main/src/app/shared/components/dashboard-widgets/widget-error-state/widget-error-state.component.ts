import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-error-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-error-state.component.html',
  styleUrls: ['./widget-error-state.component.scss']
})
export class WidgetErrorStateComponent {
  @Input() message: string = 'Failed to load data';
  @Output() retry = new EventEmitter<void>();

  onRetry() {
    this.retry.emit();
  }
}
