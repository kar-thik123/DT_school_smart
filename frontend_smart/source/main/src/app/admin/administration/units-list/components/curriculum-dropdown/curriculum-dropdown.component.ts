import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { animate, state, style, transition, trigger } from '@angular/animations';

export interface DropdownSection {
  id: string;
  name: string;
}

export interface DropdownGrade {
  id: string;
  name: string;
  sections: DropdownSection[];
  expanded?: boolean;
}

@Component({
  selector: 'app-curriculum-dropdown',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './curriculum-dropdown.component.html',
  styleUrls: ['./curriculum-dropdown.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('expanded', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('collapsed', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      transition('expanded <=> collapsed', animate('200ms ease-in-out'))
    ]),
    trigger('dropdownFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class CurriculumDropdownComponent {
  @Input() buttonLabel: string = 'Add Unit';
  @Input() items: DropdownGrade[] = [];
  
  @Output() sectionSelected = new EventEmitter<{ gradeId: string, sectionId: string }>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  toggleGrade(grade: DropdownGrade, event: Event) {
    event.stopPropagation();
    grade.expanded = !grade.expanded;
  }

  selectSection(gradeId: string, sectionId: string, event: Event) {
    event.stopPropagation();
    this.sectionSelected.emit({ gradeId, sectionId });
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
