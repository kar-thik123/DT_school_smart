import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicYearSelectorComponent } from '../academic-year-selector/academic-year-selector.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, AcademicYearSelectorComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent {
  @Input() title: string = 'Dashboard';
  @Input() selectedAcademicYearId: string | null = null;
  @Input() academicYears: any[] = [];
  @Output() yearSelected = new EventEmitter<any>();

  onYearSelected(year: any) {
    this.yearSelected.emit(year);
  }
}
