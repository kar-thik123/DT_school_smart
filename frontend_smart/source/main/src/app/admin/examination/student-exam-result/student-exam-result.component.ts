import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StudentExamResultService } from './student-exam-result.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AuthService } from '@core';
import { HierarchyDropdownComponent } from '../../administration/units-list/components/hierarchy-dropdown/hierarchy-dropdown.component';

@Component({
  selector: 'app-student-exam-result',
  templateUrl: './student-exam-result.component.html',
  styleUrls: ['./student-exam-result.component.scss'],
  standalone: true,
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('iconRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(90deg)' })),
      transition('collapsed <=> expanded', animate('200ms ease-in-out'))
    ])
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    BreadcrumbComponent,
    HierarchyDropdownComponent
  ],
})
export class StudentExamResultComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private resultService = inject(StudentExamResultService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();

  breadscrums = [
    {
      title: 'Student Exam Marks',
      items: ['Examination'],
      active: 'Mark Entry',
    },
  ];

  canManage = false;
  isLoading = false;
  isSaving = false;
  isEditMode = false;

  // Dropdown Data
  examinations: any[] = [];
  grades: any[] = [];
  allSections: any[] = [];
  allSubjectGroups: any[] = [];
  subjects: any[] = [];
  classSubjects: any[] = [];
  
  searchText: string = '';
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalFilteredStudents = 0;

  get filteredStudents() {
    let filtered = this.studentsFormArray.controls;
    
    if (this.searchText) {
      const search = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(ctrl => {
        const name = ctrl.get('student_name')?.value?.toLowerCase() || '';
        const roll = ctrl.get('roll_number')?.value?.toLowerCase() || '';
        return name.includes(search) || roll.includes(search);
      });
    }
    
    this.totalFilteredStudents = filtered.length;
    
    const startIndex = this.pageIndex * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }
  
  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  
  onSearchChange() {
    this.pageIndex = 0;
  }

  // Selections
  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;
  selectedGradeName: string = '';
  selectedSectionName: string = 'All Sections';

  selectedGroupId: string | null = null;
  selectedGroupName: string = '';

  selectedExaminationId: string | null = null;
  selectedExaminationName: string = 'Select Exam';

  // Dropdown States
  isExamOpen = false;

  // Form
  marksForm: FormGroup;
  studentsList: any[] = [];
  existingResults: any[] = [];
  isSuperAdminOrManagement = false;
  isClassTeacher = false;
  myAssignments: any[] = [];
  hasManagePermission = false;

  constructor() {
    this.marksForm = this.fb.group({
      students: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.hasManagePermission = this.authService.hasPermission('STUDENT_EXAM_RESULT', 'MANAGE') ||
      this.authService.hasPermission('EXAMINATION_MANAGE');
      
    this.isSuperAdminOrManagement = this.authService.hasPermission('IDENTITY', 'IS_SUPER_ADMIN') || 
                                    this.authService.hasPermission('IDENTITY', 'IS_MANAGEMENT');

    this.canManage = this.isSuperAdminOrManagement && this.hasManagePermission;

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isExamOpen = false;
  }

  toggleExamDropdown(event: Event) {
    event.stopPropagation();
    this.isExamOpen = !this.isExamOpen;
  }

  setExamination(exam: any) {
    this.selectedExaminationId = exam.id;
    this.selectedExaminationName = exam.exam_name;
    this.isExamOpen = false;
    this.checkAndLoadData();
  }

  onHierarchySelectionChange(event: { grade: any, section: any | 'ALL', group?: any | 'ALL' }) {
    this.selectedGradeId = event.grade.id;
    this.selectedGradeName = event.grade.name;

    if (event.section === 'ALL') {
      this.selectedSectionId = null;
      this.selectedSectionName = 'All Sections';
    } else {
      this.selectedSectionId = event.section.id;
      this.selectedSectionName = event.section.name;
    }

    if (event.group === 'ALL') {
      this.selectedGroupId = null;
      this.selectedGroupName = 'All Groups';
    } else if (event.group) {
      this.selectedGroupId = event.group.id;
      this.selectedGroupName = event.group.name;
    } else {
      this.selectedGroupId = null;
      this.selectedGroupName = '';
    }

    this.evaluatePermissions();
    this.checkAndLoadData();
  }

  evaluatePermissions() {
    if (this.isSuperAdminOrManagement) {
      this.canManage = this.hasManagePermission;
      return;
    }

    if (this.hasManagePermission && this.selectedGradeId) {
      const isClassTeacherForSelection = this.myAssignments.some(a =>
        a.assignment_type === 'CLASS_TEACHER' &&
        a.grade_id === this.selectedGradeId &&
        (!this.selectedSectionId || a.section_id === this.selectedSectionId || !a.section_id)
      );
      this.canManage = isClassTeacherForSelection;
    } else {
      this.canManage = false;
    }
  }

  loadInitialData() {
    this.isLoading = true;
    
    const observables: any = {
      examinations: this.resultService.getExaminations(),
      subjects: this.resultService.getSubjects(),
      groups: this.resultService.getSubjectGroups()
    };

    if (this.isSuperAdminOrManagement) {
      observables.grades = this.resultService.getGrades();
      observables.sections = this.resultService.getSections();
    } else {
      observables.assignments = this.resultService.getMyAssignments();
    }

    forkJoin(observables).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.examinations = res.examinations.data || res.examinations || [];
        this.subjects = res.subjects.data || res.subjects || [];
        this.allSubjectGroups = res.groups.data || res.groups || [];
        
        if (this.isSuperAdminOrManagement) {
          this.grades = res.grades.data || res.grades || [];
          this.allSections = res.sections.data || res.sections || [];
        } else if (res.assignments) {
          this.myAssignments = res.assignments;
          
          const uniqueGrades = new Map<string, any>();
          const uniqueSections = new Map<string, any>();

          this.myAssignments.forEach(a => {
            if (a.grade) uniqueGrades.set(a.grade_id, a.grade);
            if (a.section) uniqueSections.set(a.section_id, { ...a.section, grade_id: a.grade_id });
          });
          this.grades = Array.from(uniqueGrades.values());
          this.allSections = Array.from(uniqueSections.values());

          // Filter subject groups based on teacher assignments
          this.allSubjectGroups = this.allSubjectGroups.filter(group => {
            return this.myAssignments.some(a => {
              if (a.assignment_type === 'CLASS_TEACHER' && a.grade_id === group.grade_id && (!a.section_id || a.section_id === group.section_id)) {
                return true;
              }
              if (a.assignment_type === 'SUBJECT_TEACHER' && a.subject_id && group.subjects && group.subjects.some((s: any) => s.id === a.subject_id)) {
                return true;
              }
              return false;
            });
          });

          const classTeacherAssignment = this.myAssignments.find(a => a.assignment_type === 'CLASS_TEACHER');

          if (classTeacherAssignment) {
            this.selectedGradeId = classTeacherAssignment.grade_id;
            this.selectedSectionId = classTeacherAssignment.section_id || null;
            this.selectedGradeName = classTeacherAssignment.grade?.name || '';
            this.selectedSectionName = classTeacherAssignment.section?.name || 'All Sections';
          } else if (this.myAssignments.length > 0) {
            const firstAssignment = this.myAssignments[0];
            this.selectedGradeId = firstAssignment.grade_id;
            this.selectedSectionId = firstAssignment.section_id || null;
            this.selectedGradeName = firstAssignment.grade?.name || '';
            this.selectedSectionName = firstAssignment.section?.name || 'All Sections';

            // Find matching subject group for this assignment if possible
            const matchingGroup = this.allSubjectGroups.find(g =>
              g.grade_id === firstAssignment.grade_id &&
              g.section_id === firstAssignment.section_id &&
              g.subjects.some((s: any) => s.id === firstAssignment.subject_id)
            );

            if (matchingGroup) {
              this.selectedGroupId = matchingGroup.id;
              this.selectedGroupName = matchingGroup.name;
            }
          }
        }

        if (this.examinations.length > 0 && !this.selectedExaminationId) {
          this.setExamination(this.examinations[0]);
        } else {
          this.checkAndLoadData();
        }
        
        this.evaluatePermissions();

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load initial data', err);
        this.isLoading = false;
      }
    });
  }

  checkAndLoadData() {
    if (this.selectedGradeId) {
      this.loadStudentMarks();
    } else {
      this.studentsList = [];
      this.marksForm.setControl('students', this.fb.array([]));
    }
  }

  get studentsFormArray() {
    return this.marksForm.get('students') as FormArray;
  }

  loadStudentMarks() {
    this.isLoading = true;

    // Load students for this class
    this.resultService.getStudents(this.selectedGradeId!, this.selectedSectionId || undefined, this.selectedGroupId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (studentRes) => {
          this.studentsList = studentRes.data || studentRes || [];

          // Next, load existing results for this exam
          this.resultService.getAllResults(this.selectedExaminationId!, this.selectedGradeId!, this.selectedSectionId || undefined).subscribe(resultsRes => {
            const allResults = resultsRes.data || resultsRes || [];
            // Results are already filtered by the backend context
            this.existingResults = allResults;

            this.buildForm();
            this.isLoading = false;
          });
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  buildForm() {
    // Determine classSubjects based on selectedGradeId and selectedGroupId
    if (this.selectedGroupId) {
      const group = this.allSubjectGroups.find(g => g.id === this.selectedGroupId);
      if (group && group.subjects) {
        this.classSubjects = group.subjects;
      } else {
        this.classSubjects = [];
      }
    } else {
      this.classSubjects = this.subjects.filter(s => s.grade_id === this.selectedGradeId);
    }

    const groups = this.studentsList.map(enroll => {
      const student = enroll.student || enroll.user || enroll;
      const existingResult = this.existingResults.find(r => r.student_id === student.id);

      const subjectControls: any = {};
      this.classSubjects.forEach(sub => {
        let ob_marks: any = null;
        let max_marks = 100;
        if (existingResult && existingResult.subject_results) {
          const sr = existingResult.subject_results.find((x: any) => x.subject_id === sub.id);
          if (sr) {
            ob_marks = sr.obtained_marks;
            if (sr.max_marks) max_marks = sr.max_marks;
          }
        }
        subjectControls[sub.id] = this.fb.group({
          obtained: [ob_marks],
          max: [max_marks]
        });
      });

      return this.fb.group({
        student_id: [student.id],
        student_name: [student.name],
        roll_number: [student.roll_number],
        existing_result_id: [existingResult ? existingResult.id : null],
        subjects: this.fb.group(subjectControls)
      });
    });

    const arr = this.fb.array(groups);
    this.marksForm.setControl('students', arr);
  }



  saveMarks() {
    if (!this.canManage) return;

    if (this.marksForm.invalid) {
      this.marksForm.markAllAsTouched();
      this.showNotification('snackbar-danger', 'Please enter valid marks for all subjects (minimum 0).');
      console.log('Form is invalid', this.marksForm);
      return;
    }

    this.isSaving = true;
    const formValue = this.marksForm.value;
    const payloads: any[] = [];

    formValue.students.forEach((val: any) => {
      const subjectResults: any[] = [];

      if (val.subjects) {
        Object.keys(val.subjects).forEach(subjectId => {
          const marks = val.subjects[subjectId];
          if (marks && marks.obtained !== null && marks.obtained !== '') {
            subjectResults.push({
              subject_id: subjectId,
              max_marks: Number(marks.max),
              obtained_marks: Number(marks.obtained),
              pass_marks: 35,
              status: (Number(marks.obtained) >= 35 ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL'
            });
          }
        });
      }

      if (subjectResults.length > 0) {
        payloads.push({
          examination_id: this.selectedExaminationId!,
          grade_id: this.selectedGradeId!,
          section_id: this.selectedSectionId === 'ALL' ? undefined : (this.selectedSectionId || undefined),
          student_id: val.student_id,
          existing_result_id: val.existing_result_id,
          subject_results: subjectResults
        });
      }
    });

    if (payloads.length === 0) {
      this.isSaving = false;
      this.showNotification('snackbar-info', 'No marks entered to save');
      return;
    }

    this.resultService.bulkUpsertResults(payloads).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showNotification('snackbar-success', 'Marks saved successfully!');
        this.isSaving = false;
        this.isEditMode = false;
        this.loadStudentMarks(); // Reload to get updated existing_result_ids
      },
      error: (err) => {
        console.error(err);
        this.showNotification('snackbar-danger', 'Failed to save marks');
        this.isSaving = false;
      }
    });
  }

  showNotification(colorName: string, text: string): void {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: colorName,
    });
  }

  getTotals(studentGroup: any): { obtained: number | string, max: number | string, percentage: string } {
    const subjectsGroup = studentGroup.get('subjects');
    let obtained = 0;
    let max = 0;
    let hasMarks = false;

    if (subjectsGroup) {
      Object.keys(subjectsGroup.controls).forEach(key => {
        const obs = subjectsGroup.get(key)?.get('obtained')?.value;
        const mx = subjectsGroup.get(key)?.get('max')?.value;

        if (mx) {
          max += Number(mx);
        }
        if (obs !== null && obs !== '') {
          obtained += Number(obs);
          hasMarks = true;
        }
      });
    }

    if (!hasMarks) {
      return { obtained: '-', max: max || '-', percentage: '-' };
    }

    const percentage = max > 0 ? ((obtained / max) * 100).toFixed(2) + '%' : '0.00%';
    return { obtained, max, percentage };
  }
}
