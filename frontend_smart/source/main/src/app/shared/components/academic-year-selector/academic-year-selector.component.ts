import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface AcademicYear {
  id: string;
  name: string;
  is_active?: boolean;
}

@Component({
  selector: 'app-academic-year-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './academic-year-selector.component.html',
  styleUrls: ['./academic-year-selector.component.scss']
})
export class AcademicYearSelectorComponent {
  @Input() selectedAcademicYearId: string | null = null;
  @Input() academicYears: AcademicYear[] = [];
  @Output() yearSelected = new EventEmitter<AcademicYear>();

  onSelectionChange(event: any) {
    this.selectedAcademicYearId = event.value;
    const selectedYear = this.academicYears.find(y => y.id === event.value);
    if (selectedYear) {
      this.yearSelected.emit(selectedYear);
    }
  }
}
