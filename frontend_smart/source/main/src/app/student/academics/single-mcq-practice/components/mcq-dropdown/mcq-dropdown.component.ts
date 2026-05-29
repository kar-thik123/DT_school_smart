import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-mcq-dropdown',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './mcq-dropdown.component.html',
  styleUrls: ['./mcq-dropdown.component.scss'],
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
export class QuestionBankDropdownComponent implements OnInit {
  @Input() selectedSubjectId: string | null = null;
  @Input() selectedSubjectName: string = '';
  @Input() selectedUnitId: string | null = null;
  @Input() selectedUnitName: string = '';
  @Input() selectedTopicId: string | null = null;
  @Input() selectedTopicName: string = '';
  @Input() selectedSubTopicId: string | null = null;
  @Input() selectedSubTopicName: string = '';
  @Input() labelName: string = 'Curriculum';
  @Input() showUnitsAndBelow: boolean = true;
  
  // Keep these just to not break existing binding in mcq.component.html
  @Input() grades: any = [];
  @Input() allSections: any = [];
  @Input() selectedGradeId: any = null;
  @Input() selectedSectionId: any = null;
  @Input() selectedGradeName: any = '';
  @Input() selectedSectionName: any = '';

  @Output() selectionChange = new EventEmitter<{
    grade?: any,
    section?: any,
    subject: any,
    unit?: any,
    topic?: any,
    subTopic?: any
  }>();

  isHierarchyOpen = false;
  expandedSubject: string | null = null;
  expandedUnit: string | null = null;
  expandedTopic: string | null = null;

  subjects: any[] = [];
  allUnits: any[] = [];
  allTopics: any[] = [];
  allSubTopics: any[] = [];

  constructor(private eRef: ElementRef, private http: HttpClient) { }

  ngOnInit() {
    this.loadStudentCurriculum();
  }

  loadStudentCurriculum() {
    this.http.get(`${environment.apiUrl}/student-mcq/curriculum`).subscribe({
      next: (res: any) => {
        this.subjects = res.subjects || [];
        this.allUnits = res.units || [];
        this.allTopics = res.topics || [];
        this.allSubTopics = res.subTopics || [];
      },
      error: (err) => {
        console.error('Error fetching student curriculum', err);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      if (this.isHierarchyOpen) {
        this.isHierarchyOpen = false;
      }
    }
  }

  resetAllStates() {
    this.expandedSubject = null;
    this.expandedUnit = null;
    this.expandedTopic = null;
  }

  toggleDropdown() {
    if (!this.isHierarchyOpen) {
      this.resetAllStates();
      this.isHierarchyOpen = true;
    } else {
      this.isHierarchyOpen = false;
    }
  }

  getUnitsForSubject(subjectId: string): any[] {
    return this.allUnits.filter(u => u.subject_id === subjectId);
  }

  getTopicsForUnit(unitId: string): any[] {
    return this.allTopics.filter(t => t.unit_id === unitId);
  }

  getSubTopicsForTopic(topicId: string): any[] {
    return this.allSubTopics.filter(st => st.topic_id === topicId);
  }

  toggleSubject(subjectId: string, event: Event) {
    event.stopPropagation();
    this.expandedSubject = this.expandedSubject === subjectId ? null : subjectId;
    this.expandedUnit = null;
    this.expandedTopic = null;
  }

  toggleUnit(unitId: string, event: Event) {
    event.stopPropagation();
    this.expandedUnit = this.expandedUnit === unitId ? null : unitId;
    this.expandedTopic = null;
  }

  toggleTopic(topicId: string, event: Event) {
    event.stopPropagation();
    this.expandedTopic = this.expandedTopic === topicId ? null : topicId;
  }

  selectSubject(subject: any, event: Event) {
    event.stopPropagation();
    this.selectionChange.emit({ subject });
    this.isHierarchyOpen = false;
  }

  selectNode(
    subject: any,
    unit: any,
    topic: any,
    subTopic: any,
    event: Event
  ) {
    event.stopPropagation();
    this.selectionChange.emit({
      subject,
      unit: unit || undefined,
      topic: topic || undefined,
      subTopic: subTopic || undefined
    });
    this.isHierarchyOpen = false;
  }
}
