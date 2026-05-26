import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CurriculumService, ICurriculumUnit, ICurriculumTopic, ICurriculumSubTopic } from './services/curriculum.service';
import { AcademicStructureService, IGrade, ISection, ISubject } from './services/units.service';
import { HierarchyDropdownComponent } from './components/hierarchy-dropdown/hierarchy-dropdown.component';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '@core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-units-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent,
    MatTabsModule, MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatMenuModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatProgressBarModule,
    HierarchyDropdownComponent
  ],
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.scss']
})
export class UnitsListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private curriculumService = inject(CurriculumService);
  private academicService = inject(AcademicStructureService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  breadscrums = [
    {
      title: 'Curriculum Management',
      items: ['Administration'],
      active: 'Curriculum',
    },
  ];

  isLoading = false;

  // Forms
  unitForm!: FormGroup;
  topicForm!: FormGroup;
  subTopicForm!: FormGroup;

  // Data arrays
  grades: IGrade[] = [];
  sections: ISection[] = [];
  allSections: ISection[] = [];
  subjects: ISubject[] = [];
  // Master Cache
  allUnits: ICurriculumUnit[] = [];
  allTopics: ICurriculumTopic[] = [];
  allSubTopics: ICurriculumSubTopic[] = [];
  
  // Filtered Display Data
  units: ICurriculumUnit[] = [];
  topics: ICurriculumTopic[] = [];
  subTopics: ICurriculumSubTopic[] = [];

  isCurriculumLoaded = false;

  // Edit states
  editingUnitId: string | null = null;
  editingTopicId: string | null = null;
  editingSubTopicId: string | null = null;

  isHierarchyOpen = false;
  expandedGrade: any = null;

  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;
  selectedGradeName: string = '';
  selectedSectionName: string = '';

  // Table Columns
  unitColumns: string[] = ['name', 'grade', 'section', 'subject', 'actions'];
  topicColumns: string[] = ['name', 'unit', 'actions'];
  subTopicColumns: string[] = ['name', 'topic', 'actions'];
  
  canManageSyllabus = false;

  ngOnInit() {
    const isTeacherPath = this.router.url.startsWith('/teacher/');
    const parentPath = isTeacherPath ? 'Teacher' : 'Administration';
    this.breadscrums = [
      {
        title: 'Curriculum Management',
        items: [parentPath],
        active: 'Curriculum',
      },
    ];

    this.canManageSyllabus = this.authService.hasPermission('ACADEMIC', 'MANAGE_SYLLABUS') ||
                             this.authService.hasPermission('ACADEMIC_MANAGE_SYLLABUS') ||
                             this.authService.hasPermission('UNITS_LIST', 'MANAGE_SYLLABUS') ||
                             this.authService.hasPermission('UNITS_LIST_MANAGE_SYLLABUS');

    this.initForms();
    this.loadGrades();
    this.loadAllSections();
  }

  // Fetch all curriculum data in PARALLEL using forkJoin (3x faster than sequential)
  loadAllCurriculumData() {
    this.isLoading = true;
    forkJoin({
      units: this.curriculumService.getUnits({ limit: 1000 }),
      topics: this.curriculumService.getTopics({ limit: 1000 }),
      subTopics: this.curriculumService.getSubTopics({ limit: 1000 })
    }).subscribe({
      next: (res) => {
        this.allUnits = res.units.data || [];
        this.allTopics = res.topics.data || [];
        this.allSubTopics = res.subTopics.data || [];
        this.isCurriculumLoaded = true;
        this.isLoading = false;
        this.applyFilters();
      },
      error: () => this.isLoading = false
    });
  }

  applyFilters() {
    if (!this.selectedGradeId || !this.selectedSectionId) {
      this.units = [];
      this.topics = [];
      this.subTopics = [];
      return;
    }

    if (!this.isCurriculumLoaded) {
      if (!this.isLoading) {
        this.loadAllCurriculumData();
      }
      return;
    }

    // Filter units locally based on selected Grade & Section
    this.units = this.allUnits.filter(u => {
      if (this.selectedSectionId === 'ALL') {
        return u.grade_id == this.selectedGradeId;
      }
      return u.grade_id == this.selectedGradeId && 
             (u.section_id == this.selectedSectionId || !u.section_id || u.section_id === 'ALL');
    });

    // Filter topics based on filtered units (using Set for O(1) lookups)
    const unitIds = new Set(this.units.map(u => u.id));
    this.topics = this.allTopics.filter(t => unitIds.has(t.unit_id));

    // Filter subtopics based on filtered topics
    const topicIds = new Set(this.topics.map(t => t.id));
    this.subTopics = this.allSubTopics.filter(st => topicIds.has(st.topic_id));
  }

  // --- Filtering Getters ---
  get filteredUnits() {
    const subjectId = this.unitForm?.get('subject_id')?.value;
    return subjectId ? this.units.filter(u => u.subject_id === subjectId) : this.units;
  }

  get filteredTopics() {
    const unitId = this.topicForm?.get('unit_id')?.value;
    return unitId ? this.topics.filter(t => t.unit_id === unitId) : this.topics;
  }

  get filteredSubTopics() {
    const topicId = this.subTopicForm?.get('topic_id')?.value;
    return topicId ? this.subTopics.filter(st => st.topic_id === topicId) : this.subTopics;
  }

  initForms() {
    this.unitForm = this.fb.group({
      grade_id: ['', Validators.required],
      section_id: ['', Validators.required],
      subject_id: ['', Validators.required],
      name: ['', Validators.required]
    });

    this.unitForm.get('grade_id')?.valueChanges.subscribe(gradeId => {
      this.unitForm.patchValue({ section_id: '', subject_id: '' });
      if (gradeId) {
        this.loadSections(gradeId);
        this.loadSubjects(gradeId);
      } else {
        this.sections = [];
        this.subjects = [];
      }
    });

    this.topicForm = this.fb.group({
      unit_id: ['', Validators.required],
      name: ['', Validators.required]
    });

    this.subTopicForm = this.fb.group({
      topic_id: ['', Validators.required],
      name: ['', Validators.required]
    });
  }

  // --- Load Academic Structure Data ---
  loadGrades() {
    this.academicService.getGrades().subscribe(grades => {
      this.grades = grades;
    });
  }

  loadAllSections() {
    this.academicService.getSections().subscribe(sections => {
      this.allSections = sections;
    });
  }

  getSectionsForGrade(gradeId: any): ISection[] {
    return this.allSections.filter(s => s.grade_id == gradeId);
  }

  toggleGrade(gradeId: any, event: Event) {
    event.stopPropagation();
    this.expandedGrade = this.expandedGrade === gradeId ? null : gradeId;
  }

  selectGradeSectionForUnit(grade: IGrade, section: ISection | 'ALL', event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedGradeId = grade.id;
    this.selectedGradeName = grade.name;
    
    if (section === 'ALL') {
      this.selectedSectionId = 'ALL';
      this.selectedSectionName = 'All Sections';
      
      this.unitForm.patchValue({ grade_id: grade.id });
      setTimeout(() => {
        this.unitForm.patchValue({ section_id: 'ALL' });
      }, 100);
    } else {
      this.selectedSectionId = section.id;
      this.selectedSectionName = section.name;

      this.unitForm.patchValue({ grade_id: grade.id });
      setTimeout(() => {
        this.unitForm.patchValue({ section_id: section.id });
      }, 100);
    }
    this.isHierarchyOpen = false;
    
    // Load filtered curriculum from cache
    this.applyFilters();
  }

  loadSections(gradeId: string) {
    this.sections = this.allSections.filter(s => s.grade_id === gradeId);
  }

  loadSubjects(gradeId: string) {
    this.academicService.getSubjects(gradeId).subscribe(subjects => {
      this.subjects = subjects;
    });
  }

  // --- Units ---
  loadUnits() {
    this.applyFilters();
  }

  editUnit(unit: ICurriculumUnit) {
    this.editingUnitId = unit.id;
    this.unitForm.patchValue({
      grade_id: unit.grade_id,
      section_id: unit.section_id || 'ALL',
      subject_id: unit.subject_id,
      name: unit.name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditUnit(formDirective: FormGroupDirective) {
    this.editingUnitId = null;
    formDirective.resetForm({
      grade_id: this.unitForm.value.grade_id,
      section_id: this.unitForm.value.section_id,
      subject_id: this.unitForm.value.subject_id,
      name: ''
    });
  }

  createUnit(formDirective: FormGroupDirective) {
    if (this.unitForm.invalid) return;

    const formValue = this.unitForm.value;
    const isDuplicate = this.allUnits.some(u => 
      u.id !== this.editingUnitId &&
      u.name.trim().toLowerCase() === formValue.name.trim().toLowerCase() && 
      u.grade_id === formValue.grade_id &&
      u.section_id === formValue.section_id &&
      u.subject_id === formValue.subject_id
    );

    if (isDuplicate) {
      this.showNotification('error', 'A unit with this name already exists for this subject in the current context.');
      return;
    }

    if (this.editingUnitId) {
      this.curriculumService.updateUnit(this.editingUnitId, this.unitForm.value).subscribe({
        next: (res) => {
          this.showNotification('success', 'Unit updated successfully');
          if (res.data) {
            const index = this.allUnits.findIndex(u => u.id === this.editingUnitId);
            if (index !== -1) {
              const updatedItem = { ...this.allUnits[index], ...res.data };
              if (this.unitForm.value.subject_id) {
                const newSubject = this.subjects.find(s => s.id === this.unitForm.value.subject_id);
                if (newSubject) updatedItem.subject = newSubject;
              }
              this.allUnits[index] = updatedItem;
            }
          }
          this.applyFilters();
          this.cancelEditUnit(formDirective);
        },
        error: () => {
          this.showNotification('error', 'Failed to update unit');
        }
      });
    } else {
      this.curriculumService.createUnit(this.unitForm.value).subscribe({
        next: (res) => {
          this.showNotification('success', 'Unit created successfully');
          if (res.data) {
            const newItem = { ...res.data };
            if (this.unitForm.value.subject_id) {
              const newSubject = this.subjects.find(s => s.id === this.unitForm.value.subject_id);
              if (newSubject) newItem.subject = newSubject;
            }
            this.allUnits.push(newItem);
          }
          this.applyFilters();
          this.cancelEditUnit(formDirective);
        },
        error: () => {
          this.showNotification('error', 'Failed to create unit');
        }
      });
    }
  }

  deleteUnit(unit: ICurriculumUnit) {
    Swal.fire({
      text: `Do you want to delete this record: "${unit.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        // Optimistic: remove immediately from cache before server responds
        this.allUnits = this.allUnits.filter(u => u.id !== unit.id);
        const relatedTopicIds = this.allTopics.filter(t => t.unit_id === unit.id).map(t => t.id);
        this.allTopics = this.allTopics.filter(t => t.unit_id !== unit.id);
        this.allSubTopics = this.allSubTopics.filter(st => !relatedTopicIds.includes(st.topic_id));
        this.applyFilters();
        
        this.curriculumService.deleteUnit(unit.id).subscribe({
          next: () => {
            this.showNotification('success', 'Unit deleted');
          },
          error: () => {
            // Rollback on failure
            this.showNotification('error', 'Failed to delete unit');
            this.allUnits.push(unit);
            this.applyFilters();
          }
        });
      }
    });
  }

  // --- Topics ---
  loadTopics() {
    this.applyFilters();
  }

  editTopic(topic: ICurriculumTopic) {
    this.editingTopicId = topic.id;
    this.topicForm.patchValue({
      unit_id: topic.unit_id,
      name: topic.name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditTopic(formDirective: FormGroupDirective) {
    this.editingTopicId = null;
    formDirective.resetForm({
      unit_id: this.topicForm.value.unit_id,
      name: ''
    });
  }

  createTopic(formDirective: FormGroupDirective) {
    if (this.topicForm.invalid) return;

    const formValue = this.topicForm.value;
    const isDuplicate = this.allTopics.some(t => 
      t.id !== this.editingTopicId &&
      t.name.trim().toLowerCase() === formValue.name.trim().toLowerCase() &&
      t.unit_id === formValue.unit_id
    );

    if (isDuplicate) {
      this.showNotification('error', 'A topic with this name already exists in the selected unit.');
      return;
    }

    if (this.editingTopicId) {
      this.curriculumService.updateTopic(this.editingTopicId, this.topicForm.value).subscribe({
        next: (res) => {
          this.showNotification('success', 'Topic updated successfully');
          if (res.data) {
            const index = this.allTopics.findIndex(t => t.id === this.editingTopicId);
            if (index !== -1) {
              const updatedItem = { ...this.allTopics[index], ...res.data };
              if (this.topicForm.value.unit_id) {
                const newUnit = this.allUnits.find(u => u.id === this.topicForm.value.unit_id);
                if (newUnit) updatedItem.unit = newUnit;
              }
              this.allTopics[index] = updatedItem;
            }
          }
          this.applyFilters();
          this.cancelEditTopic(formDirective);
        },
        error: () => {
          this.showNotification('error', 'Failed to update topic');
        }
      });
    } else {
      this.curriculumService.createTopic(this.topicForm.value).subscribe({
        next: (res) => {
          this.showNotification('success', 'Topic created successfully');
          if (res.data) {
            const newItem = { ...res.data };
            if (this.topicForm.value.unit_id) {
              const newUnit = this.allUnits.find(u => u.id === this.topicForm.value.unit_id);
              if (newUnit) newItem.unit = newUnit;
            }
            this.allTopics.push(newItem);
          }
          this.applyFilters();
          this.cancelEditTopic(formDirective);
        },
        error: () => {
          this.showNotification('error', 'Failed to create topic');
        }
      });
    }
  }

  deleteTopic(topic: ICurriculumTopic) {
    Swal.fire({
      text: `Do you want to delete this record: "${topic.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.allTopics = this.allTopics.filter(t => t.id !== topic.id);
        this.allSubTopics = this.allSubTopics.filter(st => st.topic_id !== topic.id);
        this.applyFilters();

        this.curriculumService.deleteTopic(topic.id).subscribe({
          next: () => {
            this.showNotification('success', 'Topic deleted');
          },
          error: () => {
            this.showNotification('error', 'Failed to delete topic');
            this.allTopics.push(topic);
            this.applyFilters();
          }
        });
      }
    });
  }

  // --- Sub Topics ---
  loadSubTopics() {
    this.applyFilters();
  }

  editSubTopic(subTopic: ICurriculumSubTopic) {
    this.editingSubTopicId = subTopic.id;
    this.subTopicForm.patchValue({
      topic_id: subTopic.topic_id,
      name: subTopic.name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditSubTopic(formDirective: FormGroupDirective) {
    this.editingSubTopicId = null;
    formDirective.resetForm({
      topic_id: this.subTopicForm.value.topic_id,
      name: ''
    });
  }

  createSubTopic(formDirective: FormGroupDirective) {
    if (this.subTopicForm.invalid) return;

    const formValue = this.subTopicForm.value;
    const isDuplicate = this.allSubTopics.some(st => 
      st.id !== this.editingSubTopicId &&
      st.name.trim().toLowerCase() === formValue.name.trim().toLowerCase() &&
      st.topic_id === formValue.topic_id
    );

    if (isDuplicate) {
      this.showNotification('error', 'A sub-topic with this name already exists in the selected topic.');
      return;
    }

    if (this.editingSubTopicId) {
      this.curriculumService.updateSubTopic(this.editingSubTopicId, this.subTopicForm.value).subscribe({
        next: (res) => {
          this.showNotification('success', 'Sub Topic updated successfully');
          if (res.data) {
            const index = this.allSubTopics.findIndex(st => st.id === this.editingSubTopicId);
            if (index !== -1) {
              const updatedItem = { ...this.allSubTopics[index], ...res.data };
              if (this.subTopicForm.value.topic_id) {
                const newTopic = this.allTopics.find(t => t.id === this.subTopicForm.value.topic_id);
                if (newTopic) updatedItem.topic = newTopic;
              }
              this.allSubTopics[index] = updatedItem;
            }
          }
          this.applyFilters();
          this.cancelEditSubTopic(formDirective);
        },
        error: () => {
          this.showNotification('error', 'Failed to update sub topic');
        }
      });
    } else {
      this.curriculumService.createSubTopic(this.subTopicForm.value).subscribe({
        next: (res) => {
          this.showNotification('success', 'Sub Topic created successfully');
          if (res.data) {
            const newItem = { ...res.data };
            if (this.subTopicForm.value.topic_id) {
              const newTopic = this.allTopics.find(t => t.id === this.subTopicForm.value.topic_id);
              if (newTopic) newItem.topic = newTopic;
            }
            this.allSubTopics.push(newItem);
          }
          this.applyFilters();
          this.cancelEditSubTopic(formDirective);
        },
        error: () => {
          this.showNotification('error', 'Failed to create sub topic');
        }
      });
    }
  }

  deleteSubTopic(subTopic: ICurriculumSubTopic) {
    Swal.fire({
      text: `Do you want to delete this record: "${subTopic.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.allSubTopics = this.allSubTopics.filter(st => st.id !== subTopic.id);
        this.applyFilters();

        this.curriculumService.deleteSubTopic(subTopic.id).subscribe({
          next: () => {
            this.showNotification('success', 'Sub Topic deleted');
          },
          error: () => {
            this.showNotification('error', 'Failed to delete sub topic');
            this.allSubTopics.push(subTopic);
            this.applyFilters();
          }
        });
      }
    });
  }

  private showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
