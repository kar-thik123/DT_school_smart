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
import { AcademicStructurePreviewComponent } from './academic-structure-preview/academic-structure-preview.component';
import * as XLSX from 'xlsx';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core';

@Component({
  selector: 'app-academic-structure',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent,
    MatTabsModule, MatIconModule, MatButtonModule, MatCardModule, 
    MatTableModule, MatMenuModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatDialogModule, MatSnackBarModule, MatDividerModule,
    MatTooltipModule, DragDropModule, MatProgressBarModule, AcademicStructurePreviewComponent
  ],
  templateUrl: './academic-structure.component.html',
  styleUrls: ['./academic-structure.component.scss']
})
export class AcademicStructureComponent implements OnInit {
  private academicService = inject(AcademicStructureService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  breadscrums = [
    {
      title: 'Academic Structure',
      items: ['Administration'],
      active: 'Academic Structure',
    },
  ];

  isLoading = true;

  showPreviewModal = false;
  previewData: any[] = [];
  previewSummary: any = {};
  previewSessionId: string | null = null;

  // Grades & Sections
  grades: IGrade[] = [];
  selectedGrade: IGrade | null = null;
  sectionsForSelectedGrade: ISection[] = [];
  
  // Subjects
  subjectFilterGradeId: string = '';
  subjects: ISubject[] = [];

  // Groups / Streams
  groupFilterGradeId: string = '';
  groupFilterSectionId: string = '';
  groupsForSelectedSection: import('./services/academic-structure.service').ISubjectGroup[] = [];
  sectionsForGroupFilter: ISection[] = [];

  canImportStructure = false;
  canExportStructure = false;

  ngOnInit() {
    this.canImportStructure = this.authService.hasPermission('ACADEMIC_STRUCTURE', 'IMPORT') ||
                              this.authService.hasPermission('ACADEMIC_STRUCTURE_IMPORT');
    this.canExportStructure = this.authService.hasPermission('ACADEMIC_STRUCTURE', 'EXPORT') ||
                              this.authService.hasPermission('ACADEMIC_STRUCTURE_EXPORT');
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

  // --- Groups / Streams Actions ---
  getSubjectCount(group: import('./services/academic-structure.service').ISubjectGroup, type: string): number {
    return group.subjects.filter(s => s.subject_type === type).length;
  }

  onGroupGradeChange() {
    this.groupFilterSectionId = '';
    this.groupsForSelectedSection = [];
    if (!this.groupFilterGradeId) {
      this.sectionsForGroupFilter = [];
      return;
    }
    this.academicService.getSections().subscribe(sections => {
      this.sectionsForGroupFilter = sections.filter(s => s.grade_id === this.groupFilterGradeId);
    });
  }

  loadGroups() {
    if (!this.groupFilterGradeId || !this.groupFilterSectionId) {
      this.groupsForSelectedSection = [];
      return;
    }
    this.academicService.getSubjectGroups(this.groupFilterGradeId, this.groupFilterSectionId).subscribe({
      next: (groups) => this.groupsForSelectedSection = groups,
      error: () => this.showNotification('error', 'Failed to load Groups / Streams')
    });
  }

  addGroup(name: string) {
    if (!name.trim() || !this.groupFilterGradeId || !this.groupFilterSectionId) return;
    this.academicService.createSubjectGroup({
      name,
      grade_id: this.groupFilterGradeId,
      section_id: this.groupFilterSectionId,
      subjects: []
    }).subscribe({
      next: () => {
        this.showNotification('success', 'Group created successfully');
        this.loadGroups();
      },
      error: () => this.showNotification('error', 'Failed to create group')
    });
  }

  deleteGroup(groupId: string) {
    if (confirm('Are you sure you want to delete this Group/Stream?')) {
      this.academicService.deleteSubjectGroup(groupId).subscribe({
        next: () => {
          this.showNotification('success', 'Group deleted');
          this.loadGroups();
        },
        error: () => this.showNotification('error', 'Failed to delete group')
      });
    }
  }

  openGroupMappingDialog(group: import('./services/academic-structure.service').ISubjectGroup) {
    // We will dynamically import the dialog or use a created component
    // For now we will create the component file and reference it.
    import('./dialogs/subject-group-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.SubjectGroupDialogComponent, {
        width: '600px',
        data: { group, gradeId: this.groupFilterGradeId }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadGroups();
      });
    });
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

  private  showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // --- Bulk Import / Export ---
  onFileImport(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      this.showNotification('error', 'Cannot use multiple files');
      return;
    }
    const file = target.files[0];
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        const csv = XLSX.utils.sheet_to_csv(ws);
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvFile = new File([csvBlob], 'import.csv', { type: 'text/csv' });

        this.isLoading = true;
        this.academicService.uploadBulkCsvPreview(csvFile).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.previewSessionId = res.session_id;
            this.previewSummary = res.summary || {};
            this.previewData = res.records || [];
            this.showPreviewModal = true;
          },
          error: (err) => {
            this.isLoading = false;
            console.error(err);
            this.showNotification('error', err.error?.message || 'Error processing preview.');
          }
        });
      } catch (err) {
        console.error('Error reading Excel file:', err);
        this.showNotification('error', 'Invalid Excel file format.');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = null; // reset input
  }

  discardImport() {
    if (this.previewSessionId) {
      this.academicService.discardBulkImport(this.previewSessionId).subscribe({
        next: () => {},
        error: (err) => console.error('Error discarding preview', err)
      });
    }
    this.showPreviewModal = false;
    this.previewData = [];
    this.previewSummary = {};
    this.previewSessionId = null;
  }

  revalidateImport(modifiedRecords: any[]) {
    this.isLoading = true;
    
    const header = [
      'Grade', 'Section', 'Subject', 'Subject Type', 'Group / Stream Name'
    ];
    
    const csvRows = [header.join(',')];
    
    for (const r of modifiedRecords) {
      const row = header.map(field => {
        const val = r[field] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const csvBlob = new Blob([csvString], { type: 'text/csv' });
    const csvFile = new File([csvBlob], 'import.csv', { type: 'text/csv' });

    this.academicService.uploadBulkCsvPreview(csvFile).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.previewSessionId = res.session_id;
        this.previewSummary = res.summary || {};
        this.previewData = res.records || [];
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.showNotification('error', err.error?.message || 'Error re-validating preview.');
      }
    });
  }

  confirmImport(modifiedRecords?: any[]) {
    if (!this.previewSessionId) return;
    this.isLoading = true;
    this.showPreviewModal = false;
    this.academicService.confirmBulkImport(this.previewSessionId, modifiedRecords).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showNotification('success', res.message || 'Data imported successfully!');
        this.previewSessionId = null;
        this.discardImport();
        this.loadInitialData(); // Refresh UI
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        const msg = err.error?.message || 'Error importing data.';
        this.showNotification('error', msg);
        this.discardImport();
      }
    });
  }

  async exportExcel() {
    this.isLoading = true;
    try {
      const grades = await firstValueFrom(this.academicService.getGrades()) || [];
      const sections = await firstValueFrom(this.academicService.getSections()) || [];
      const subjects = await firstValueFrom(this.academicService.getSubjects()) || [];
      const groups = await firstValueFrom(this.academicService.getSubjectGroups(undefined, undefined, false)) || [];

      const data: any[] = [];
      let sNo = 1;

      // Create a map of grades
      const gradeMap = new Map(grades.map(g => [g.id, g.name]));
      const sectionMap = new Map(sections.map(s => [s.id, s]));
      const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

      // We need to iterate over all grades
      for (const g of grades) {
        const gradeSections = sections.filter(s => s.grade_id === g.id);
        const gradeSubjects = subjects.filter(s => s.grade_id === g.id);

        if (gradeSections.length === 0 && gradeSubjects.length === 0) {
           data.push({
             'S.No': sNo++,
             'Grade': g.name,
             'Section': '',
             'Subject': '',
             'Subject Type': '',
             'Group / Stream Name': ''
           });
           continue;
        }

        // Output by sections
        for (const s of gradeSections) {
           const sectionGroups = groups.filter((grp: any) => grp.grade_id === g.id && grp.section_id === s.id);
           
           if (sectionGroups.length === 0) {
              data.push({
                 'S.No': sNo++,
                 'Grade': g.name,
                 'Section': s.name,
                 'Subject': '',
                 'Subject Type': '',
                 'Group / Stream Name': ''
              });
              continue;
           }

           for (const grp of sectionGroups) {
              const grpName = (grp as any).name;
              if ((grp as any).subjects && (grp as any).subjects.length > 0) {
                 for (const subLink of (grp as any).subjects) {
                    const subName = subLink.name || subjectMap.get(subLink.id) || '';
                    data.push({
                       'S.No': sNo++,
                       'Grade': g.name,
                       'Section': s.name,
                       'Subject': subName,
                       'Subject Type': subLink.subject_type || 'MANDATORY',
                       'Group / Stream Name': grpName
                    });
                 }
              } else {
                 data.push({
                    'S.No': sNo++,
                    'Grade': g.name,
                    'Section': s.name,
                    'Subject': '',
                    'Subject Type': '',
                    'Group / Stream Name': grpName
                 });
              }
           }
        }

        // Global subjects not linked to any section
        const linkedSubjectIds = new Set<string>();
        groups.filter((grp: any) => grp.grade_id === g.id).forEach((grp: any) => {
           if ((grp as any).subjects) {
              (grp as any).subjects.forEach((link: any) => linkedSubjectIds.add(link.id));
           }
        });

        for (const sub of gradeSubjects) {
           if (!linkedSubjectIds.has(sub.id)) {
              data.push({
                 'S.No': sNo++,
                 'Grade': g.name,
                 'Section': '',
                 'Subject': sub.name,
                 'Subject Type': 'MANDATORY',
                 'Group / Stream Name': ''
              });
           }
        }
      }

      if (data.length === 0) {
        this.showNotification('error', 'No data to export');
        this.isLoading = false;
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = { Sheets: { 'Academic Structure': worksheet }, SheetNames: ['Academic Structure'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Academic_Structure_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      this.showNotification('error', 'Error exporting data');
    } finally {
      this.isLoading = false;
    }
  }
}
