import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AcademicStructureService, IGrade, ISection, ISubject } from './services/academic-structure.service';
import { BulkSetupDialogComponent } from './dialogs/bulk-setup-dialog.component';

@Component({
  selector: 'app-academic-structure',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent,
    MatTabsModule, MatIconModule, MatButtonModule, MatCardModule, 
    MatTableModule, MatMenuModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatDialogModule, MatSnackBarModule, MatDividerModule,
    MatTooltipModule, DragDropModule, MatProgressBarModule
  ],
  templateUrl: './academic-structure.component.html',
  styleUrls: ['./academic-structure.component.scss']
})
export class AcademicStructureComponent implements OnInit {
  private academicService = inject(AcademicStructureService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  breadscrums = [
    {
      title: 'Academic Structure',
      items: ['Administration'],
      active: 'Academic Structure',
    },
  ];

  isLoading = true;

  // Grades & Sections
  grades: IGrade[] = [];
  selectedGrade: IGrade | null = null;
  sectionsForSelectedGrade: ISection[] = [];
  
  // Subjects
  subjectFilterGradeId: string = '';
  subjects: ISubject[] = [];

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      await this.loadGrades();
    } catch (error) {
      this.showNotification('error', 'Failed to load academic structure data');
    } finally {
      this.isLoading = false;
    }
  }

  loadGrades(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.academicService.getGrades().subscribe({
        next: (grades) => {
          this.grades = grades;
          if (this.grades.length > 0 && !this.selectedGrade) {
            this.selectGrade(this.grades[0]);
          } else if (this.selectedGrade) {
            // Refresh selected grade sections
            this.selectGrade(this.grades.find(g => g.id === this.selectedGrade?.id) || this.grades[0]);
          }
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  selectGrade(grade: IGrade) {
    this.selectedGrade = grade;
    this.academicService.getSections().subscribe({
      next: (sections) => {
        this.sectionsForSelectedGrade = sections.filter(s => s.grade_id === grade.id).sort((a, b) => a.sort_order - b.sort_order);
      }
    });
  }

  // --- Grade Actions ---
  addGrade(name: string) {
    if (!name.trim()) return;
    this.academicService.createGrade(name).subscribe({
      next: () => {
        this.showNotification('success', 'Grade added successfully');
        this.loadGrades();
      },
      error: () => this.showNotification('error', 'Failed to add grade')
    });
  }

  toggleGradeStatus(grade: IGrade) {
    const newStatus = !grade.is_active;
    this.academicService.updateGrade(grade.id, { is_active: newStatus }).subscribe({
      next: () => {
        grade.is_active = newStatus;
        this.showNotification('success', `Grade ${newStatus ? 'activated' : 'archived'}`);
      },
      error: () => this.showNotification('error', 'Failed to update grade status')
    });
  }

  deleteGrade(grade: IGrade) {
    if (confirm(`Are you sure you want to delete ${grade.name}? This cannot be undone.`)) {
      this.academicService.deleteGrade(grade.id).subscribe({
        next: () => {
          this.showNotification('success', 'Grade deleted');
          if (this.selectedGrade?.id === grade.id) this.selectedGrade = null;
          this.loadGrades();
        },
        error: () => this.showNotification('error', 'Failed to delete grade')
      });
    }
  }

  dropGrade(event: any) {
    moveItemInArray(this.grades, event.previousIndex, event.currentIndex);
    const updates = this.grades.map((g, index) => ({ id: g.id, sort_order: index }));
    this.academicService.reorderItems('grades', updates).subscribe();
  }

  // --- Section Actions ---
  addSection(name: string) {
    if (!name.trim() || !this.selectedGrade) return;
    this.academicService.createSection({ name, grade_id: this.selectedGrade.id }).subscribe({
      next: () => {
        this.showNotification('success', 'Section added successfully');
        this.selectGrade(this.selectedGrade!);
      },
      error: () => this.showNotification('error', 'Failed to add section')
    });
  }

  toggleSectionStatus(section: ISection) {
    const newStatus = !section.is_active;
    this.academicService.updateSection(section.id, { is_active: newStatus }).subscribe({
      next: () => {
        section.is_active = newStatus;
        this.showNotification('success', `Section ${newStatus ? 'activated' : 'archived'}`);
      },
      error: () => this.showNotification('error', 'Failed to update section status')
    });
  }

  deleteSection(section: ISection) {
    if (confirm(`Are you sure you want to delete section ${section.name}?`)) {
      this.academicService.deleteSection(section.id).subscribe({
        next: () => {
          this.showNotification('success', 'Section deleted');
          this.selectGrade(this.selectedGrade!);
        },
        error: () => this.showNotification('error', 'Failed to delete section')
      });
    }
  }

  dropSection(event: any) {
    moveItemInArray(this.sectionsForSelectedGrade, event.previousIndex, event.currentIndex);
    const updates = this.sectionsForSelectedGrade.map((s, index) => ({ id: s.id, sort_order: index }));
    this.academicService.reorderItems('sections', updates).subscribe();
  }

  // --- Subject Actions ---
  loadSubjects() {
    if (!this.subjectFilterGradeId) {
      this.subjects = [];
      return;
    }
    this.academicService.getSubjects(this.subjectFilterGradeId).subscribe({
      next: (subjects) => {
        this.subjects = subjects;
      },
      error: () => this.showNotification('error', 'Failed to load subjects')
    });
  }

  addSubject(name: string) {
    if (!name.trim() || !this.subjectFilterGradeId) return;
    this.academicService.createSubject({ name, grade_id: this.subjectFilterGradeId }).subscribe({
      next: () => {
        this.showNotification('success', 'Subject added successfully');
        this.loadSubjects();
      },
      error: () => this.showNotification('error', 'Failed to add subject')
    });
  }

  toggleSubjectStatus(subject: ISubject) {
    const newStatus = !subject.is_active;
    this.academicService.updateSubject(subject.id, { is_active: newStatus }).subscribe({
      next: () => {
        subject.is_active = newStatus;
        this.showNotification('success', `Subject ${newStatus ? 'activated' : 'archived'}`);
      },
      error: () => this.showNotification('error', 'Failed to update subject status')
    });
  }

  deleteSubject(subject: ISubject) {
    if (confirm(`Are you sure you want to delete subject ${subject.name}?`)) {
      this.academicService.deleteSubject(subject.id).subscribe({
        next: () => {
          this.showNotification('success', 'Subject deleted');
          this.loadSubjects();
        },
        error: () => this.showNotification('error', 'Failed to delete subject')
      });
    }
  }

  dropSubject(event: any) {
    moveItemInArray(this.subjects, event.previousIndex, event.currentIndex);
    const updates = this.subjects.map((s, index) => ({ id: s.id, sort_order: index }));
    this.academicService.reorderItems('subjects', updates).subscribe();
  }

  // --- Bulk Wizard ---
  openBulkSetupWizard() {
    const dialogRef = this.dialog.open(BulkSetupDialogComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInitialData(); // Refresh all if success
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
