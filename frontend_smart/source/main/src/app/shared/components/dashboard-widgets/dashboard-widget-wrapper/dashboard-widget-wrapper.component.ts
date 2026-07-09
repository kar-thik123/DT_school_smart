import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetSkeletonComponent } from '../widget-skeleton/widget-skeleton.component';
import { WidgetEmptyStateComponent } from '../widget-empty-state/widget-empty-state.component';
import { WidgetErrorStateComponent } from '../widget-error-state/widget-error-state.component';

export type WidgetState = 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-dashboard-widget-wrapper',
  standalone: true,
  imports: [
    CommonModule, 
    WidgetSkeletonComponent, 
    WidgetEmptyStateComponent, 
    WidgetErrorStateComponent
  ],
  templateUrl: './dashboard-widget-wrapper.component.html',
  styleUrls: ['./dashboard-widget-wrapper.component.scss']
})
export class DashboardWidgetWrapperComponent {
  @Input() state: WidgetState = 'loading';
  
  // Skeleton configuration
  @Input() skeletonType: 'kpi' | 'chart' | 'list' | 'banner' = 'kpi';
  @Input() skeletonHeight: string = '100%';
  
  // Empty state configuration
  @Input() emptyMessage: string = 'No data available';
  @Input() emptyIcon: string = 'inbox';
  
  // Error state configuration
  @Input() errorMessage: string = 'Failed to load data';
  
  @Output() retry = new EventEmitter<void>();

  onRetry() {
    this.retry.emit();
  }
}
