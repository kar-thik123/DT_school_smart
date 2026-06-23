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
      title: 'Student Exam Results',
      items: ['Examination'],
      active: 'Results Entry',
    },
  ];

  canManage = false;
  isLoading = false;
  isSaving = false;

  // Dropdown Data
  examinations: any[] = [];
  grades: any[] = [];
  allSections: any[] = [];
  allSubjectGroups: any[] = [];
  subjects: any[] = [];
  classSubjects: any[] = [];
  
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

  constructor() {
    this.marksForm = this.fb.group({
      students: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.canManage = this.authService.hasPermission('STUDENT_EXAM_RESULT', 'MANAGE') || 
                     this.authService.hasPermission('EXAMINATION_MANAGE');
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

    this.checkAndLoadData();
  }

  loadInitialData() {
    this.isLoading = true;
    forkJoin({
      examinations: this.resultService.getExaminations(),
      grades: this.resultService.getGrades(),
      subjects: this.resultService.getSubjects(),
      sections: this.resultService.getSections(),
      groups: this.resultService.getSubjectGroups()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.examinations = res.examinations.data || res.examinations || [];
        this.grades = res.grades.data || res.grades || [];
        this.subjects = res.subjects.data || res.subjects || [];
        this.allSections = res.sections.data || res.sections || [];
        this.allSubjectGroups = res.groups.data || res.groups || [];
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
    this.resultService.getStudents(this.selectedGradeId!, this.selectedSectionId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (studentRes) => {
          this.studentsList = studentRes.data || studentRes || [];
          
          // Next, load existing results for this exam
          this.resultService.getAllResults().subscribe(resultsRes => {
            const allResults = resultsRes.data || resultsRes || [];
            // Filter to results matching our context
            this.existingResults = allResults.filter((r: any) => 
              r.examination_id === this.selectedExaminationId && 
              r.grade_id === this.selectedGradeId && 
              (this.selectedSectionId ? r.section_id === this.selectedSectionId : true)
            );
            
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
         let ob_marks = '';
         let max_marks = 100;
         if (existingResult && existingResult.subject_results) {
            const sr = existingResult.subject_results.find((x: any) => x.subject_id === sub.id);
            if (sr) {
               ob_marks = sr.obtained_marks;
               if (sr.max_marks) max_marks = sr.max_marks;
            }
         }
         subjectControls[sub.id] = this.fb.group({
            obtained: [ob_marks, [Validators.min(0)]],
            max: [max_marks, [Validators.required, Validators.min(0)]]
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
    if (!this.canManage || this.marksForm.invalid) {
      this.marksForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.marksForm.value;
    const requests: any[] = [];

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
        const payload = {
          examination_id: this.selectedExaminationId!,
          grade_id: this.selectedGradeId!,
          section_id: this.selectedSectionId === 'ALL' ? undefined : (this.selectedSectionId || undefined),
          student_id: val.student_id,
          subject_results: subjectResults
        };

        if (val.existing_result_id) {
          requests.push(this.resultService.updateResult(val.existing_result_id, payload));
        } else {
          requests.push(this.resultService.createResult(payload));
        }
      }
    });

    if (requests.length === 0) {
      this.isSaving = false;
      this.showNotification('snackbar-info', 'No marks entered to save');
      return;
    }

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showNotification('snackbar-success', 'Marks saved successfully!');
        this.isSaving = false;
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
}
