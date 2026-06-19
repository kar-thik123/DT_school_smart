import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TeacherAssignmentService } from './services/teacher-assignment.service';
import { AcademicStructureService, IGrade, ISection } from '../academic-structure/services/academic-structure.service';
import { AcademicYearService } from '../../academics/academic-year/academic-year.service';
import { AssignmentType, ITeacherAssignment, IBatchTeacherAssignmentPayload } from './models/teacher-assignment.model';
import { AuthService, AcademicContextService } from '@core';
import { Router } from '@angular/router';
import { AcademicContextSelectorComponent, IAcademicContextSelection } from '@shared/components/academic-context-selector/academic-context-selector.component';

@Component({
  selector: 'app-teacher-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    BreadcrumbComponent,
    AcademicContextSelectorComponent
  ],
  templateUrl: './teacher-assignment.component.html',
  styleUrls: ['./teacher-assignment.component.scss']
})
export class TeacherAssignmentComponent implements OnInit {
  private assignmentService = inject(TeacherAssignmentService);
  private academicService = inject(AcademicStructureService);
  private academicYearService = inject(AcademicYearService);
  private academicContextService = inject(AcademicContextService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  breadscrums = [
    { title: 'Teacher Assignment', items: ['Administration'], active: 'Teacher Assignment' }
  ];

  activeAcademicYear: any;
  grades: IGrade[] = [];
  sections: ISection[] = [];
  teachers: {id: string, name: string, email: string}[] = [];
  
  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;
  selectedGradeName: string = '';
  selectedSectionName: string = '';
  selectedGroupId: string | null = null;

  currentClassTeacherId: string | null = null;
  currentClassTeacherAssignment: ITeacherAssignment | null = null;

  sectionSubjects: any[] = [];
  subjectTeacherMap: { [subjectId: string]: string | null } = {};
  existingSubjectAssignments: ITeacherAssignment[] = [];

  isLoadingSubjects = false;
  isSaving = false;
  canManageAssignments = false;

  allAssignments: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = ['teacherName', 'assignmentType', 'grade', 'section', 'subject'];

  private _paginator!: MatPaginator;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this._paginator = mp;
    if (this.dataSource) {
      this.dataSource.paginator = mp;
    }
  }

  get paginator(): MatPaginator {
    return this._paginator;
  }

  ngOnInit() {
    const isTeacherPath = this.router.url.startsWith('/teacher/');
    const parentPath = isTeacherPath ? 'Teacher' : 'Administration';
    this.breadscrums = [
      { title: 'Teacher Assignment', items: [parentPath], active: 'Teacher Assignment' }
    ];

    this.canManageAssignments = this.authService.hasPermission('TEACHER_ASSIGNMENT', 'CREATE') ||
                                this.authService.hasPermission('TEACHER_ASSIGNMENT_CREATE') ||
                                this.authService.hasPermission('TEACHER_ASSIGNMENT', 'DELETE') ||
                                this.authService.hasPermission('TEACHER_ASSIGNMENT_DELETE');

    this.academicContextService.activeYear$.subscribe((year: any) => {
      this.activeAcademicYear = year;
      this.refreshAssignments();
    });

    this.loadInitialData();
  }

  loadInitialData() {
    this.academicService.getGrades().subscribe((grades) => this.grades = grades);
    this.academicService.getSections().subscribe((sections) => this.sections = sections);
    
    this.assignmentService.getInstructionalStaff().subscribe((teachers) => {
      this.teachers = teachers;
    });
  }


  onAcademicContextChange(context: IAcademicContextSelection) {
    const { grade, section, subjectGroup } = context;

    this.selectedGradeId = grade?.id || null;
    this.selectedGradeName = grade?.name || '';

    if (section && section !== 'ALL') {
      this.selectedSectionId = section.id;
      this.selectedSectionName = section.name;
    } else {
      this.selectedSectionId = null;
      this.selectedSectionName = '';
    }

    this.selectedGroupId = subjectGroup?.id || null;
    if (subjectGroup) {
      this.selectedSectionName += ` (${subjectGroup.name})`;
    }

    this.resetAssignments();
    this.refreshAssignments();
    if (this.selectedGradeId && this.selectedSectionId) {
      this.loadSubjectsForSection();
    }
  }

  resetAssignments() {
    this.currentClassTeacherId = null;
    this.currentClassTeacherAssignment = null;
    this.sectionSubjects = [];
    this.subjectTeacherMap = {};
    this.existingSubjectAssignments = [];
  }

  refreshAssignments() {
    this.assignmentService.getAllAssignments().subscribe((assignments) => {
      this.allAssignments = assignments;
      
      const currentFilter = this.dataSource?.filter || '';
      this.dataSource = new MatTableDataSource(assignments);
      if (this._paginator) {
        this.dataSource.paginator = this._paginator;
      }
      this.dataSource.filterPredicate = (data: any, filter: string) => {
        const searchStr = (
          (data.teacher?.name || '') + 
          (data.assignment_type || '') + 
          (data.grade?.name || '') + 
          (data.section?.name || '') + 
          (data.subject?.name || '')
        ).toLowerCase();
        return searchStr.includes(filter);
      };
      this.dataSource.filter = currentFilter;

      if (this.selectedGradeId && this.selectedSectionId) {
        const sectionAssignments = assignments.filter(a => 
          a.section_id === this.selectedSectionId
        );

        // Class Teacher
        const classTeacher = sectionAssignments.find(a => a.assignment_type === AssignmentType.CLASS_TEACHER);
        if (classTeacher) {
          this.currentClassTeacherAssignment = classTeacher;
          this.currentClassTeacherId = classTeacher.teacher_id;
        }

        // Subject Teachers
        this.existingSubjectAssignments = sectionAssignments.filter(a => a.assignment_type === AssignmentType.SUBJECT_TEACHER);
        this.existingSubjectAssignments.forEach(a => {
          if (a.subject_id) {
            this.subjectTeacherMap[a.subject_id] = a.teacher_id;
          }
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadSubjectsForSection() {
    this.isLoadingSubjects = true;
    // We fetch subject groups for the section including default group
    this.academicService.getSubjectGroups(this.selectedGradeId!, this.selectedSectionId!, false).subscribe({
      next: (groups) => {
        if (groups && groups.length > 0) {
          // Flatten all subjects from all groups for this section
          this.sectionSubjects = [];
          groups.forEach(g => {
            if (this.selectedGroupId && g.id !== this.selectedGroupId) return;

            g.subjects.forEach(sub => {
               if(!this.sectionSubjects.find(s => s.subject.id === sub.id)) {
                 this.sectionSubjects.push({
                   subject: { id: sub.id, name: sub.name },
                   is_elective: sub.subject_type === 'ELECTIVE'
                 });
               }
            });
          });
          
          this.sectionSubjects.forEach(s => {
            if (this.subjectTeacherMap[s.subject.id] === undefined) {
              this.subjectTeacherMap[s.subject.id] = null;
            }
          });
        } else {
          this.sectionSubjects = [];
        }
        this.isLoadingSubjects = false;
      },
      error: () => {
        this.isLoadingSubjects = false;
        this.sectionSubjects = [];
      }
    });
  }

  saveClassTeacher() {
    if (!this.selectedGradeId || !this.selectedSectionId || !this.activeAcademicYear) return;

    this.isSaving = true;

    // If clearing
    if (!this.currentClassTeacherId) {
      if (this.currentClassTeacherAssignment) {
        this.assignmentService.deleteAssignment(this.currentClassTeacherAssignment.id).subscribe({
          next: () => {
            this.showNotification('success', 'Class Teacher removed successfully');
            this.currentClassTeacherAssignment = null;
            this.isSaving = false;
          },
          error: (err) => {
            this.showNotification('error', err.error?.message || 'Error removing Class Teacher');
            this.isSaving = false;
          }
        });
      } else {
        this.isSaving = false;
      }
      return;
    }

    const payload = {
      teacher_id: this.currentClassTeacherId,
      assignment_type: AssignmentType.CLASS_TEACHER,
      grade_id: this.selectedGradeId,
      section_id: this.selectedSectionId
    };

    const req = this.currentClassTeacherAssignment 
      ? this.assignmentService.updateAssignment(this.currentClassTeacherAssignment.id, payload)
      : this.assignmentService.createAssignment(payload);

    req.subscribe({
      next: (res) => {
        this.showNotification('success', 'Class Teacher assigned successfully');
        this.currentClassTeacherAssignment = res.assignment;
        this.isSaving = false;
      },
      error: (err) => {
        this.showNotification('error', err.error?.message || 'Failed to assign Class Teacher');
        this.isSaving = false;
      }
    });
  }

  saveSubjectTeachers() {
    if (!this.selectedGradeId || !this.selectedSectionId || !this.activeAcademicYear) return;

    const newAssignments: any[] = [];
    const loadedSubjectIds = this.sectionSubjects.map(s => s.subject.id);
    
    // Build array of intended assignments
    for (const [subjectId, teacherId] of Object.entries(this.subjectTeacherMap)) {
      if (teacherId && loadedSubjectIds.includes(subjectId)) {
        newAssignments.push({
          assignment_type: AssignmentType.SUBJECT_TEACHER,
          grade_id: this.selectedGradeId,
          section_id: this.selectedSectionId,
          subject_id: subjectId,
          teacher_id: teacherId
        });
      }
    }

    this.isSaving = true;

    // First delete existing subject assignments for the LOADED subjects
    const assignmentsToDelete = this.existingSubjectAssignments.filter(a => loadedSubjectIds.includes(a.subject_id!));

    const deletePromises = assignmentsToDelete.map(a => 
      this.assignmentService.deleteAssignment(a.id).toPromise().catch(() => null)
    );

    Promise.all(deletePromises).then(() => {
      if (newAssignments.length === 0) {
        this.showNotification('success', 'Subject Teachers mapped successfully');
        this.refreshAssignments(); // reload
        this.isSaving = false;
        return;
      }

      // Group by teacher for batch insert since API accepts batch grouped by teacher
      const groupedByTeacher: { [key: string]: any[] } = {};
      newAssignments.forEach(a => {
        if (!groupedByTeacher[a.teacher_id]) groupedByTeacher[a.teacher_id] = [];
        groupedByTeacher[a.teacher_id].push({
          assignment_type: a.assignment_type,
          grade_id: a.grade_id,
          section_id: a.section_id,
          subject_id: a.subject_id
        });
      });

      const createPromises = Object.keys(groupedByTeacher).map(teacherId => {
        const payload: any = {
          teacher_id: teacherId,
          assignments: groupedByTeacher[teacherId]
        };
        return this.assignmentService.createBatchAssignments(payload).toPromise();
      });

      Promise.all(createPromises).then(() => {
        this.showNotification('success', 'Subject Teachers mapped successfully');
        this.refreshAssignments(); // reload
        this.isSaving = false;
      }).catch(err => {
        this.showNotification('error', 'Error saving subject teachers');
        this.isSaving = false;
      });

    });
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-danger'
    });
  }
}
