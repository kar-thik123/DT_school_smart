import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { IGrade, ISection, ISubjectGroup } from '../../services/units.service';

@Component({
  selector: 'app-hierarchy-dropdown',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './hierarchy-dropdown.component.html',
  styleUrls: ['./hierarchy-dropdown.component.scss'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('expandAnimation', [
      state('expanded', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('collapsed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      transition('expanded <=> collapsed', animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('iconRotate', [
      state('expanded', style({ transform: 'rotate(90deg)' })),
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      transition('expanded <=> collapsed', animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class HierarchyDropdownComponent {
  @Input() grades: IGrade[] = [];
  @Input() allSections: ISection[] = [];
  @Input() selectedGradeId: string | null = null;
  @Input() selectedSectionId: string | null = null;
  @Input() allSubjectGroups?: ISubjectGroup[] = [];
  @Input() selectedGroupId?: string | null = null;
  @Input() selectedGradeName: string = '';
  @Input() selectedSectionName: string = '';
  @Input() selectedGroupName?: string = '';
  @Input() labelName: string = 'Curriculum';

  @Output() selectionChange = new EventEmitter<{ grade: IGrade, section: ISection | 'ALL', group?: ISubjectGroup | 'ALL' }>();

  isHierarchyOpen = false;
  expandedGrade: string | null = null;
  expandedSection: string | null = null;

  constructor(private eRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isHierarchyOpen = false;
    }
  }

  toggleDropdown() {
    if (!this.isHierarchyOpen) {
      this.expandedGrade = null;
      this.isHierarchyOpen = true;
    } else {
      this.isHierarchyOpen = false;
    }
  }

  toggleGrade(gradeId: string, event: Event) {
    event.stopPropagation();
    this.expandedGrade = this.expandedGrade === gradeId ? null : gradeId;
  }

  getSectionsForGrade(gradeId: string): ISection[] {
    return this.allSections.filter(s => s.grade_id === gradeId);
  }

  getGroupsForSection(sectionId: string): ISubjectGroup[] {
    if (!this.allSubjectGroups) return [];
    return this.allSubjectGroups.filter(g => g.section_id === sectionId);
  }

  toggleSectionOrSelect(grade: IGrade, section: ISection | 'ALL', event: Event) {
    event.stopPropagation();
    if (section === 'ALL') {
      this.selectionChange.emit({ grade, section });
      this.isHierarchyOpen = false;
      return;
    }

    const groups = this.getGroupsForSection(section.id);
    if (groups.length === 0) {
      this.selectionChange.emit({ grade, section });
      this.isHierarchyOpen = false;
    } else {
      this.expandedSection = this.expandedSection === section.id ? null : section.id;
    }
  }

  selectGradeSectionGroup(grade: IGrade, section: ISection, group: ISubjectGroup | 'ALL', event: Event) {
    event.stopPropagation();
    this.selectionChange.emit({ grade, section, group });
    this.isHierarchyOpen = false;
  }
}
