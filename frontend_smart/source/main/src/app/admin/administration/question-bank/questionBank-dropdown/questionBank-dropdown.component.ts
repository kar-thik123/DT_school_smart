import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { AcademicStructureService, IGrade, ISection, ISubject, ISubjectGroup, ISubjectGroupSubject } from '../../units-list/services/units.service';
import { CurriculumService, ICurriculumUnit, ICurriculumTopic, ICurriculumSubTopic } from '../../units-list/services/curriculum.service';

@Component({
  selector: 'app-questionbank-dropdown',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './questionBank-dropdown.component.html',
  styleUrls: ['./questionBank-dropdown.component.scss'],
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
  @Input() grades: IGrade[] = [];
  @Input() allSections: ISection[] = [];
  @Input() selectedGradeId: string | null = null;
  @Input() selectedSectionId: string | null = null;
  @Input() selectedGradeName: string = '';
  @Input() selectedSectionName: string = '';
  @Input() selectedSubjectId: string | null = null;
  @Input() selectedSubjectName: string = '';
  @Input() selectedUnitId: string | null = null;
  @Input() selectedUnitName: string = '';
  @Input() selectedTopicId: string | null = null;
  @Input() selectedTopicName: string = '';
  @Input() selectedSubTopicId: string | null = null;
  @Input() selectedSubTopicName: string = '';
  @Input() labelName: string = 'Curriculum';

  @Output() selectionChange = new EventEmitter<{
    grade: IGrade,
    section: ISection | 'ALL' | null,
    subject: ISubject | ISubjectGroupSubject | null,
    unit?: ICurriculumUnit | null,
    topic?: ICurriculumTopic | null,
    subTopic?: ICurriculumSubTopic | null
  }>();

  private academicService = inject(AcademicStructureService);
  private curriculumService = inject(CurriculumService);

  isHierarchyOpen = false;
  expandedGrade: string | null = null;
  expandedSection: string | null = null;
  expandedGroup: string | null = null;
  expandedSubject: string | null = null;
  expandedUnit: string | null = null;
  expandedTopic: string | null = null;

  subjectGroups: ISubjectGroup[] = [];
  subjects: ISubject[] = [];
  allUnits: ICurriculumUnit[] = [];
  allTopics: ICurriculumTopic[] = [];
  allSubTopics: ICurriculumSubTopic[] = [];

  constructor(private eRef: ElementRef) { }

  ngOnInit() {
    this.loadDropdownData();
  }

  loadDropdownData() {
    this.academicService.getSubjects().subscribe(subs => {
      this.subjects = subs || [];
    });
    this.academicService.getSubjectGroups(undefined, undefined, false).subscribe(groups => {
      this.subjectGroups = groups || [];
    });
    this.curriculumService.getUnits({ limit: 1000 }).subscribe(res => {
      this.allUnits = res?.data || [];
    });
    this.curriculumService.getTopics({ limit: 1000 }).subscribe(res => {
      this.allTopics = res?.data || [];
    });
    this.curriculumService.getSubTopics({ limit: 1000 }).subscribe(res => {
      this.allSubTopics = res?.data || [];
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
    this.expandedGrade = null;
    this.expandedSection = null;
    this.expandedGroup = null;
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

  toggleGrade(gradeId: string, event: Event) {
    event.stopPropagation();
    this.expandedGrade = this.expandedGrade === gradeId ? null : gradeId;
    this.expandedSection = null;
    this.expandedGroup = null;
    this.expandedSubject = null;
    this.expandedUnit = null;
    this.expandedTopic = null;
  }

  toggleSection(sectionId: string, event: Event) {
    event.stopPropagation();
    this.expandedSection = this.expandedSection === sectionId ? null : sectionId;
    this.expandedGroup = null;
    this.expandedSubject = null;
    this.expandedUnit = null;
    this.expandedTopic = null;
  }

  toggleGroup(groupId: string, event: Event) {
    event.stopPropagation();
    this.expandedGroup = this.expandedGroup === groupId ? null : groupId;
    this.expandedSubject = null;
    this.expandedUnit = null;
    this.expandedTopic = null;
  }

  getSectionsForGrade(gradeId: string): ISection[] {
    return this.allSections.filter(s => s.grade_id === gradeId);
  }

  getGroupsForSection(gradeId: string, sectionId: string): ISubjectGroup[] {
    return this.subjectGroups.filter(g => g.grade_id === gradeId && g.section_id === sectionId);
  }

  getSubjectsForSection(gradeId: string, sectionId: string): ISubject[] {
    return this.subjects.filter(s => s.grade_id === gradeId && (!s.section_ids || s.section_ids.length === 0 || s.section_ids.includes(sectionId)));
  }

  getSubjectsForGrade(gradeId: string): ISubject[] {
    return this.subjects.filter(s => s.grade_id === gradeId);
  }

  getUnitsForSubject(subjectId: string): ICurriculumUnit[] {
    return this.allUnits.filter(u => u.subject_id === subjectId);
  }

  getTopicsForUnit(unitId: string): ICurriculumTopic[] {
    return this.allTopics.filter(t => t.unit_id === unitId);
  }

  getSubTopicsForTopic(topicId: string): ICurriculumSubTopic[] {
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

  selectSubject(
    grade: IGrade,
    section: ISection | 'ALL',
    subject: ISubject | ISubjectGroupSubject,
    event: Event
  ) {
    event.stopPropagation();
    this.selectionChange.emit({
      grade,
      section,
      subject
    });
    this.isHierarchyOpen = false;
  }

  selectNode(
    grade: IGrade,
    section: ISection | 'ALL' | null,
    subject: ISubject | ISubjectGroupSubject | null,
    unit: ICurriculumUnit | null,
    topic: ICurriculumTopic | null,
    subTopic: ICurriculumSubTopic | null,
    event: Event
  ) {
    event.stopPropagation();
    this.selectionChange.emit({
      grade,
      section,
      subject,
      unit: unit || undefined,
      topic: topic || undefined,
      subTopic: subTopic || undefined
    });
    this.isHierarchyOpen = false;
  }
}
