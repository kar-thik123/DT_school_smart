import { Component, OnInit, inject } from '@angular/core';
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
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TeacherAssignmentService } from './services/teacher-assignment.service';
import { AcademicStructureService, IGrade, ISection } from '../academic-structure/services/academic-structure.service';
import { AcademicYearService } from '../../academics/academic-year/academic-year.service';
import { AssignmentType, ITeacherAssignment, IBatchTeacherAssignmentPayload } from './models/teacher-assignment.model';

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
    BreadcrumbComponent
  ],
  templateUrl: './teacher-assignment.component.html',
  styleUrls: ['./teacher-assignment.component.scss']
})
export class TeacherAssignmentComponent implements OnInit {
  private assignmentService = inject(TeacherAssignmentService);
  private academicService = inject(AcademicStructureService);
  private academicYearService = inject(AcademicYearService);
  private snackBar = inject(MatSnackBar);

  breadscrums = [
    { title: 'Teacher Assignment', items: ['Administration'], active: 'Teacher Assignment' }
  ];

  activeAcademicYear: any;
  grades: IGrade[] = [];
  sections: ISection[] = [];
  filteredSections: ISection[] = [];
  teachers: {id: string, name: string, email: string}[] = [];
  
  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;

  currentClassTeacherId: string | null = null;
  currentClassTeacherAssignment: ITeacherAssignment | null = null;

  sectionSubjects: any[] = [];
  subjectTeacherMap: { [subjectId: string]: string | null } = {};
  existingSubjectAssignments: ITeacherAssignment[] = [];

  isLoadingSubjects = false;
  isSaving = false;

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.academicYearService.getAllAcademicYears().subscribe((years: any) => {
      this.activeAcademicYear = years.find((y: any) => y.is_active) || null;
    });

    this.academicService.getGrades().subscribe((grades) => this.grades = grades);
    this.academicService.getSections().subscribe((sections) => this.sections = sections);
    
    this.assignmentService.getInstructionalStaff().subscribe((teachers) => {
      this.teachers = teachers;
    });
  }

  onGradeChange() {
    this.selectedSectionId = null;
    this.filteredSections = this.sections.filter(s => s.grade_id === this.selectedGradeId);
    this.resetAssignments();
  }

  onSectionChange() {
    this.resetAssignments();
    if (this.selectedGradeId && this.selectedSectionId) {
      this.loadAssignmentsForSection();
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

  loadAssignmentsForSection() {
    this.assignmentService.getAllAssignments().subscribe((assignments) => {
      // Filter for this section and year
      const sectionAssignments = assignments.filter(a => 
        a.section_id === this.selectedSectionId && 
        a.academic_year_id === this.activeAcademicYear?.id
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
    });
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
      academic_year_id: this.activeAcademicYear.id,
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
    
    // Build array of intended assignments
    for (const [subjectId, teacherId] of Object.entries(this.subjectTeacherMap)) {
      if (teacherId) {
        newAssignments.push({
          assignment_type: AssignmentType.SUBJECT_TEACHER,
          grade_id: this.selectedGradeId,
          section_id: this.selectedSectionId,
          subject_id: subjectId,
          teacher_id: teacherId
        });
      }
    }

    if (newAssignments.length === 0) {
      this.showNotification('error', 'Please assign at least one subject teacher to save');
      return;
    }

    // Since our backend endpoint doesn't strictly have a "replace all" bulk endpoint,
    // we would ideally delete existing ones for this section and insert new.
    // For simplicity, we can do a delete and then batch insert. 
    
    this.isSaving = true;

    // First delete existing subject assignments for this section
    const deletePromises = this.existingSubjectAssignments.map(a => 
      this.assignmentService.deleteAssignment(a.id).toPromise().catch(() => null)
    );

    Promise.all(deletePromises).then(() => {
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
        const payload: IBatchTeacherAssignmentPayload = {
          teacher_id: teacherId,
          academic_year_id: this.activeAcademicYear.id,
          assignments: groupedByTeacher[teacherId]
        };
        return this.assignmentService.createBatchAssignments(payload).toPromise();
      });

      Promise.all(createPromises).then(() => {
        this.showNotification('success', 'Subject Teachers mapped successfully');
        this.loadAssignmentsForSection(); // reload
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
