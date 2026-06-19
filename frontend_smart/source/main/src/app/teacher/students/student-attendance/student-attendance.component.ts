import { Component, OnDestroy, OnInit, inject, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, forkJoin, of } from 'rxjs';
import { StudentAttendanceService } from './student-attendance.service';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { environment } from 'environments/environment';
import { HierarchyDropdownComponent } from '../../../admin/administration/units-list/components/hierarchy-dropdown/hierarchy-dropdown.component';
import { AcademicStructureService, IGrade, ISection, ISubjectGroup } from '../../../admin/administration/units-list/services/units.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.scss'],
  animations: [
    rowsAnimation,
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
        animate('150ms cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }))
      ])
    ]),
    trigger('iconRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(90deg)' })),
      transition('collapsed <=> expanded', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    MasterTableComponent,
    HierarchyDropdownComponent,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [DatePipe]
})
export class StudentAttendanceComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  attendanceService = inject(StudentAttendanceService);
  private snackBar = inject(MatSnackBar);
  private httpClient = inject(HttpClient);

  morningPhaseId: string = '';
  afternoonPhaseId: string = '';

  selectedPeriod: 'DAY' | 'WEEK' | 'MONTH' = 'DAY';

  isLoading = false;
  isSaving = false;
  hasChanges = false;
  private destroy$ = new Subject<void>();

  phases: any[] = [];
  selectedDate: Date = new Date();

  // Range view data
  rangeAttendanceData: any[] = [];
  rangeDays: number[] = [];
  selectedYear: number = new Date().getFullYear();
  selectedMonth: string = new Date().toLocaleString('default', { month: 'long' });

  isClassTeacher = false;
  classTeacherMessage = '';
  selectedGradeId = '';
  selectedSectionId = '';
  selectedGradeName = '';
  selectedSectionName = '';

  myAssignments: any[] = [];
  grades: IGrade[] = [];
  allSections: ISection[] = [];
  allSubjectGroups: ISubjectGroup[] = [];
  selectedGroupId: string | null = null;
  selectedGroupName: string = '';

  academicService = inject(AcademicStructureService);

  breadscrums = [
    {
      title: 'Student Attendance',
      items: ['Teacher', 'Students'],
      active: 'Attendance',
    },
  ];

  columnDefinitions: ColumnDefinition[] = [
    { def: 'sno', label: 'S.No', type: 'text', visible: true },
    { def: 'roll_number', label: 'Roll No', type: 'text', visible: true },
    { def: 'name', label: 'Name', type: 'text', visible: true },
    {
      def: 'morning_status',
      label: 'Morning',
      type: 'checkbox',
      visible: true,
      hideHeaderCheckbox: true,
      statusBadgeMap: {
        'PRESENT': 'col-green',
        'ABSENT': 'col-red',
        'LATE': 'col-orange'
      },
      statusIconMap: {
        'PRESENT': 'check_circle_outline',
        'ABSENT': 'highlight_off',
        'LATE': 'schedule'
      }
    },
    {
      def: 'afternoon_status',
      label: 'Afternoon',
      type: 'checkbox',
      visible: true,
      hideHeaderCheckbox: true,
      statusBadgeMap: {
        'PRESENT': 'col-green',
        'ABSENT': 'col-red',
        'LATE': 'col-orange'
      },
      statusIconMap: {
        'PRESENT': 'check_circle_outline',
        'ABSENT': 'highlight_off',
        'LATE': 'schedule'
      }
    },
    {
      def: 'late_status',
      label: 'Late',
      type: 'text',
      visible: true
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true }
  ];

  dataSource = new MatTableDataSource<any>([]);

  ngOnInit() {
    this.loadPhases();
    this.loadMyAssignments();
  }



  onHierarchySelectionChange(event: { grade: IGrade, section: ISection | 'ALL', group?: ISubjectGroup | 'ALL' }) {
    this.selectedGradeId = event.grade.id;
    this.selectedGradeName = event.grade.name;

    if (event.section === 'ALL') {
      this.selectedSectionId = 'ALL';
      this.selectedSectionName = 'All Sections';
    } else {
      this.selectedSectionId = event.section.id;
      this.selectedSectionName = event.section.name;
    }

    if (event.group) {
      if (event.group === 'ALL') {
        this.selectedGroupId = 'ALL';
        this.selectedGroupName = 'All Groups';
      } else {
        this.selectedGroupId = event.group.id;
        this.selectedGroupName = event.group.name;
      }
    } else {
      this.selectedGroupId = null;
      this.selectedGroupName = '';
    }

    // Check if the teacher is a CLASS_TEACHER for this selection
    const isClassTeacherForSelection = this.myAssignments.some(a =>
      a.assignment_type === 'CLASS_TEACHER' &&
      a.grade_id === event.grade.id &&
      (event.section === 'ALL' ? true : a.section_id === event.section.id || !a.section_id)
    );

    this.isClassTeacher = isClassTeacherForSelection;
    this.updateColumnTypes();

    let groupMsg = this.selectedGroupName && this.selectedGroupName !== 'All Groups' ? ` - ${this.selectedGroupName}` : '';
    let sectionMsg = event.section === 'ALL' ? ' - All Sections' : ` - ${event.section.name}`;

    this.classTeacherMessage = `${event.grade.name}${sectionMsg}${groupMsg}`;

    this.handleRefresh();
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case 'DAY': return 'Today';
      case 'WEEK': return 'This Week';
      case 'MONTH': return 'This Month';
      default: return 'Today';
    }
  }

  isPeriodOpen = false;

  togglePeriodDropdown(event: Event) {
    event.stopPropagation();
    this.isPeriodOpen = !this.isPeriodOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-wrapper')) {
      this.isPeriodOpen = false;
    }
  }

  setPeriod(period: 'DAY' | 'WEEK' | 'MONTH') {
    this.selectedPeriod = period;
    this.isPeriodOpen = false;
    this.handleRefresh();
  }

  onDateChange(event: any) {
    if (event.value) {
      this.selectedDate = event.value;
      this.handleRefresh();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPhases() {
    this.attendanceService.getPhases().subscribe({
      next: (res) => {
        this.phases = res;
        const morning = this.phases.find(p => p.phase_name.toLowerCase() === 'morning');
        const afternoon = this.phases.find(p => p.phase_name.toLowerCase() === 'afternoon');
        this.morningPhaseId = morning ? morning.id : '';
        this.afternoonPhaseId = afternoon ? afternoon.id : '';

        if (this.isClassTeacher && this.selectedGradeId) {
          this.handleRefresh();
        }
      },
      error: (err) => this.showNotification('Error loading phases')
    });
  }

  loadMyAssignments() {
    forkJoin({
      assignments: this.attendanceService.getMyAssignments(),
      groups: this.academicService.getSubjectGroups(undefined, undefined, true)
    }).subscribe({
      next: (res) => {
        const assignments = res.assignments;
        const allGroups = res.groups;

        const uniqueGrades = new Map<string, IGrade>();
        const uniqueSections = new Map<string, ISection>();

        assignments.forEach(a => {
          if (a.grade) {
            uniqueGrades.set(a.grade_id, a.grade as IGrade);
          }
          if (a.section) {
            uniqueSections.set(a.section_id, { ...a.section, grade_id: a.grade_id } as ISection);
          }
        });

        this.myAssignments = assignments;
        this.grades = Array.from(uniqueGrades.values());
        this.allSections = Array.from(uniqueSections.values());

        // Filter subject groups based on teacher assignments
        this.allSubjectGroups = allGroups.filter(group => {
          return assignments.some(a => {
            if (a.assignment_type === 'CLASS_TEACHER' && a.grade_id === group.grade_id && (!a.section_id || a.section_id === group.section_id)) {
              return true;
            }
            if (a.assignment_type === 'SUBJECT_TEACHER' && a.subject_id && group.subjects && group.subjects.some(s => s.id === a.subject_id)) {
              return true;
            }
            return false;
          });
        });

        const classTeacherAssignment = assignments.find(a => a.assignment_type === 'CLASS_TEACHER');
        if (classTeacherAssignment) {
          this.isClassTeacher = true;
          this.updateColumnTypes();
          this.selectedGradeId = classTeacherAssignment.grade_id;
          this.selectedSectionId = classTeacherAssignment.section_id || '';
          this.selectedGradeName = classTeacherAssignment.grade?.name || '';
          this.selectedSectionName = classTeacherAssignment.section?.name || '';
          let sectionMsg = classTeacherAssignment.section?.name ? ` - ${classTeacherAssignment.section.name}` : '';
          this.classTeacherMessage = `${classTeacherAssignment.grade?.name || ''}${sectionMsg}`;
          this.handleRefresh();
        } else if (assignments.length > 0) {
          this.isClassTeacher = false;
          this.updateColumnTypes();
          const firstAssignment = assignments[0];
          this.selectedGradeId = firstAssignment.grade_id;
          this.selectedSectionId = firstAssignment.section_id || '';
          this.selectedGradeName = firstAssignment.grade?.name || '';
          this.selectedSectionName = firstAssignment.section?.name || '';

          // Find matching subject group for this assignment if possible
          const matchingGroup = this.allSubjectGroups.find(g =>
            g.grade_id === firstAssignment.grade_id &&
            g.section_id === firstAssignment.section_id &&
            g.subjects.some(s => s.id === firstAssignment.subject_id)
          );

          if (matchingGroup) {
            this.selectedGroupId = matchingGroup.id;
            this.selectedGroupName = matchingGroup.name;
          }

          let sectionMsg = firstAssignment.section?.name ? ` - ${firstAssignment.section.name}` : '';
          let groupMsg = this.selectedGroupName ? ` - ${this.selectedGroupName}` : '';

          this.classTeacherMessage = `${firstAssignment.grade?.name || ''}${sectionMsg}${groupMsg}`;
          this.handleRefresh();
        } else {
          this.isClassTeacher = false;
          this.updateColumnTypes();
          this.classTeacherMessage = 'You have no assignments. Attendance tracking is restricted.';
        }
      },
      error: () => {
        this.showNotification('Error loading your assignments');
        this.classTeacherMessage = '';
      }
    });
  }

  handleRefresh() {
    if (!this.selectedGradeId) {
      return;
    }

    if (this.selectedPeriod === 'WEEK' || this.selectedPeriod === 'MONTH') {
      this.loadRangeAttendance();
      return;
    }

    this.isLoading = true;
    const datePipe = new DatePipe('en-US');
    const dateStr = datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;

    let enrollUrl = `${environment.apiUrl}/student-enrollments?grade_id=${this.selectedGradeId}`;
    if (this.selectedSectionId && this.selectedSectionId !== 'ALL') enrollUrl += `&section_id=${this.selectedSectionId}`;
    if (this.selectedGroupId && this.selectedGroupId !== 'ALL') enrollUrl += `&subject_group_id=${this.selectedGroupId}`;

    this.httpClient.get<any[]>(enrollUrl).subscribe({
      next: (enrollments) => {
        if (!this.morningPhaseId || !this.afternoonPhaseId) {
          const data = enrollments.map((e, index) => ({
            sno: index + 1,
            id: e.student_id,
            student_id: e.student_id,
            name: e.student.name,
            roll_number: e.student.roll_number,
            morning_status: this.isClassTeacher ? '' : '-',
            afternoon_status: this.isClassTeacher ? '' : '-',
            late_status: '-'
          }));
          this.dataSource.data = data;
          this.isLoading = false;
          return;
        }

        forkJoin({
          morning: this.attendanceService.getDailyAttendance(this.selectedGradeId, this.morningPhaseId, dateStr, this.selectedSectionId),
          afternoon: this.attendanceService.getDailyAttendance(this.selectedGradeId, this.afternoonPhaseId, dateStr, this.selectedSectionId)
        }).subscribe({
          next: ({ morning, afternoon }) => {
            const morningMap = new Map();
            morning.forEach((r: any) => morningMap.set(r.student_id, r));

            const afternoonMap = new Map();
            afternoon.forEach((r: any) => afternoonMap.set(r.student_id, r));

            const data = enrollments.map((e, index) => {
              const mExisting = morningMap.get(e.student_id);
              const aExisting = afternoonMap.get(e.student_id);

              let lateTime = '-';

              return {
                sno: index + 1,
                id: e.student_id,
                student_id: e.student_id,
                name: e.student.name,
                roll_number: e.student.roll_number,
                morning_status: mExisting ? mExisting.status : (this.isClassTeacher ? '' : '-'),
                afternoon_status: aExisting ? aExisting.status : (this.isClassTeacher ? '' : '-'),
                late_status: lateTime
              };
            });
            this.dataSource.data = data;

            // Check visibility of afternoon checkboxes
            this.updateAfternoonVisibility();

            this.hasChanges = false;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
            this.showNotification('Error loading attendance records');
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('Error loading students');
      }
    });
  }

  async saveAttendance() {
    if (!this.dataSource.data.length) return;
    if (!this.morningPhaseId || !this.afternoonPhaseId) {
      this.showNotification('Morning/Afternoon phases not configured. Please contact Administration.');
      return;
    }

    if (this.isAfternoonComplete()) {
      const isSameStatus = (s1: string, s2: string) => {
        if (s1 === s2) return true;
        const isPresentOrLate = (s: string) => s === 'PRESENT' || s === 'LATE';
        if (isPresentOrLate(s1) && isPresentOrLate(s2)) return true;
        return false;
      };

      const differences = this.dataSource.data.filter(s => 
        s.morning_status && s.afternoon_status && !isSameStatus(s.morning_status, s.afternoon_status)
      );

      if (differences.length > 0) {
        let diffHtml = `
          <p style="font-size: 15px; color: #4b5563; margin-top: 10px; margin-bottom: 15px; text-align: center; line-height: 1.5;">
            <strong class="text-danger" style="font-size: 18px;">${differences.length}</strong> student(s) have different attendance statuses between Morning and Afternoon.
          </p>
          <p style="font-size: 15px; color: #1f2937; font-weight: 500; text-align: center; margin-bottom: 0;">
            Proceed and save?
          </p>
        `;

        const result = await Swal.fire({
          title: `<h3 style="margin:0; padding-bottom: 12px; border-bottom: 1px solid #eaeaea; font-size: 22px; font-weight: 600; color: #202124; text-align: center;">Attendance Mismatch</h3>`,
          html: diffHtml,
          showCancelButton: true,
          confirmButtonText: 'Save Changes',
          cancelButtonText: 'Review',
          confirmButtonColor: '#6750a4',
          cancelButtonColor: '#ef4444',
          width: '450px',
          padding: '1.5em'
        });

        if (!result.isConfirmed) {
          return;
        }
      }
    }

    this.isSaving = true;
    const datePipe = new DatePipe('en-US');
    const dateStr = datePipe.transform(this.selectedDate, 'yyyy-MM-dd') + 'T00:00:00.000Z';

    const morningPayload = {
      grade_id: this.selectedGradeId,
      section_id: this.selectedSectionId || undefined,
      phase_id: this.morningPhaseId,
      attendance_date: dateStr,
      records: this.dataSource.data.map(s => ({
        student_id: s.student_id,
        status: s.morning_status
      })).filter(s => s.status !== '' && s.status !== '-')
    };

    const afternoonPayload = {
      grade_id: this.selectedGradeId,
      section_id: this.selectedSectionId || undefined,
      phase_id: this.afternoonPhaseId,
      attendance_date: dateStr,
      records: this.dataSource.data.map(s => ({
        student_id: s.student_id,
        status: s.afternoon_status
      })).filter(s => s.status !== '' && s.status !== '-')
    };

    const payloads = [];
    if (morningPayload.records.length > 0) {
      payloads.push(this.attendanceService.markAttendance(morningPayload));
    }
    if (afternoonPayload.records.length > 0) {
      payloads.push(this.attendanceService.markAttendance(afternoonPayload));
    }

    if (payloads.length === 0) {
      this.isSaving = false;
      this.showNotification('No valid attendance records to save.');
      return;
    }

    forkJoin(payloads).subscribe({
      next: () => {
        this.isSaving = false;
        this.hasChanges = false;
        this.showNotification('Saved changes successfully', 'snackbar-success');
        this.handleRefresh();
      },
      error: () => {
        this.isSaving = false;
        this.showNotification('Failed to save attendance');
      }
    });
  }

  handleAdd() {
    this.showNotification('Please mark statuses and click Save All Changes');
  }

  handleCheckboxChange(event: any) {
    const { row, column, event: checkboxEvent } = event;
    const isChecked = checkboxEvent.checked;
    row['_selected_' + column.def] = isChecked;
    this.dataSource._updateChangeSubscription();
  }

  handleHeaderCheckboxChange(event: any) {
    const { column, event: checkboxEvent } = event;
    const isChecked = checkboxEvent.checked;
    this.dataSource.data.forEach(row => {
      if (!row[column.def]) {
        row['_selected_' + column.def] = isChecked;
      }
    });
    this.dataSource._updateChangeSubscription();
  }

  updateColumnTypes() {
    const morningCol = this.columnDefinitions.find(c => c.def === 'morning_status');
    const afternoonCol = this.columnDefinitions.find(c => c.def === 'afternoon_status');
    const actionsCol = this.columnDefinitions.find(c => c.def === 'actions');

    if (morningCol) morningCol.type = this.isClassTeacher ? 'checkbox' : 'status';
    if (afternoonCol) afternoonCol.type = this.isClassTeacher ? 'checkbox' : 'status';
    if (actionsCol) actionsCol.visible = this.isClassTeacher;

    // Force mat-table to re-render columns structure if necessary
    this.columnDefinitions = [...this.columnDefinitions];
  }

  updateAfternoonVisibility() {
    if (!this.isClassTeacher || !this.dataSource || !this.dataSource.data) return;
    
    // Don't auto-reveal afternoon checkboxes if there are unsaved local changes
    if (this.hasChanges) return;

    const isMorningDone = this.isMorningComplete();
    this.dataSource.data.forEach(row => {
      // If Morning is not done, hide Afternoon by setting it to '-'
      if (!isMorningDone && row.afternoon_status === '') {
        row.afternoon_status = '-';
      }
      // If Morning is done, reveal Afternoon checkboxes for those that are '-'
      else if (isMorningDone && row.afternoon_status === '-') {
        row.afternoon_status = '';
      }
    });
  }

  get currentPhaseColumn(): string {
    return this.isMorningComplete() ? 'afternoon_status' : 'morning_status';
  }

  hasAnySelection(): boolean {
    return this.dataSource.data.some(row =>
      row['_selected_morning_status'] || row['_selected_afternoon_status']
    );
  }

  hasAnyAfternoonMarked(): boolean {
    if (!this.dataSource || !this.dataSource.data) return false;
    return this.dataSource.data.some(row => row.afternoon_status && row.afternoon_status !== '-');
  }

  hasAnyMarked(): boolean {
    if (!this.dataSource || !this.dataSource.data) return false;
    const colName = this.currentPhaseColumn;
    return this.dataSource.data.some(row => !!row[colName] && row[colName] !== '-');
  }

  isMorningComplete(): boolean {
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) return false;
    return this.dataSource.data.every(row => !!row.morning_status && row.morning_status !== '-');
  }

  isAfternoonComplete(): boolean {
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) return false;
    return this.dataSource.data.every(row => !!row.afternoon_status && row.afternoon_status !== '-');
  }

  copyMorningToAfternoon() {
    let changed = false;
    this.dataSource.data.forEach(row => {
      if (!row.afternoon_status && row.morning_status) {
        row.afternoon_status = row.morning_status;
        this.updateLateTime(row);
        changed = true;
        this.hasChanges = true;
      }
    });
    if (changed) {
      this.updateAfternoonVisibility();
      this.dataSource._updateChangeSubscription();
      this.showNotification('Morning status copied to Afternoon.');
    }
  }

  copyMorningForSelected() {
    let changed = false;
    this.dataSource.data.forEach(row => {
      if (row['_selected_afternoon_status'] && !row.afternoon_status && row.morning_status) {
        row.afternoon_status = row.morning_status;
        row['_selected_afternoon_status'] = false;
        this.updateLateTime(row);
        changed = true;
        this.hasChanges = true;
      }
    });
    if (changed) {
      this.updateAfternoonVisibility();
      this.dataSource._updateChangeSubscription();
      this.showNotification('Morning status copied for selected students.');
    }
  }

  updateLateTime(row: any) {
    if (row.morning_status === 'LATE' || row.afternoon_status === 'LATE') {
      if (!row.late_status || row.late_status === '-') {
        row.late_status = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      row.late_status = '-';
    }
  }

  markSelected(status: string) {
    let changed = false;
    const colName = this.currentPhaseColumn;
    this.dataSource.data.forEach(row => {
      if (row['_selected_' + colName]) {
        row[colName] = status;
        row['_selected_' + colName] = false;
        this.updateLateTime(row);
        changed = true;
        this.hasChanges = true;
      }
    });

    if (changed) {
      this.updateAfternoonVisibility();
      this.dataSource._updateChangeSubscription();
      this.showNotification(`Selected students marked as ${status}.`);
    } else {
      this.showNotification('No students selected.');
    }
  }

  get suggestedRestAction(): 'PRESENT' | 'ABSENT' {
    if (!this.dataSource || !this.dataSource.data) return 'PRESENT';
    const colName = this.currentPhaseColumn;
    const presentCount = this.dataSource.data.filter(r => r[colName] === 'PRESENT').length;
    const absentCount = this.dataSource.data.filter(r => r[colName] === 'ABSENT').length;
    const lateCount = this.dataSource.data.filter(r => r[colName] === 'LATE').length;

    if (presentCount > 0 && absentCount === 0 && lateCount === 0) {
      return 'ABSENT';
    }

    return 'PRESENT';
  }

  markRest(status: 'PRESENT' | 'ABSENT') {
    let changed = false;
    const colName = this.currentPhaseColumn;
    this.dataSource.data.forEach(row => {
      if (!row[colName] || row[colName] === '-') {
        row[colName] = status;
        this.updateLateTime(row);
        changed = true;
        this.hasChanges = true;
      }
    });

    if (changed) {
      this.updateAfternoonVisibility();
      this.dataSource._updateChangeSubscription();
      this.showNotification(`Unmarked students have been set to ${status}.`);
    } else {
      this.showNotification('All students are already marked.');
    }
  }

  loadRangeAttendance() {
    this.isLoading = true;
    const { startDate, endDate, daysCount } = this.getRangeDates();

    this.selectedYear = startDate.getFullYear();
    this.selectedMonth = startDate.toLocaleString('default', { month: 'long' });
    this.rangeDays = Array.from({ length: daysCount }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d.getDate();
    });

    const datePipe = new DatePipe('en-US');
    const startStr = datePipe.transform(startDate, 'yyyy-MM-dd')!;
    const endStr = datePipe.transform(endDate, 'yyyy-MM-dd')!;

    let enrollUrl = `${environment.apiUrl}/student-enrollments?grade_id=${this.selectedGradeId}`;
    if (this.selectedSectionId && this.selectedSectionId !== 'ALL') enrollUrl += `&section_id=${this.selectedSectionId}`;
    if (this.selectedGroupId && this.selectedGroupId !== 'ALL') enrollUrl += `&subject_group_id=${this.selectedGroupId}`;

    forkJoin({
      enrollments: this.httpClient.get<any[]>(enrollUrl),
      attendance: this.attendanceService.getRangeAttendance(this.selectedGradeId, startStr, endStr, this.selectedSectionId !== 'ALL' ? this.selectedSectionId : undefined)
    }).subscribe({
      next: ({ enrollments, attendance }) => {
        const studentMap = new Map<string, any>();

        enrollments.forEach(e => {
          studentMap.set(e.student_id, {
            name: e.student.name,
            avatar: e.student.user_profile?.profile_image || 'assets/images/user/user1.jpg',
            attendanceStatus: new Array(daysCount).fill('-'),
            morningStatus: new Array(daysCount).fill('-'),
            afternoonStatus: new Array(daysCount).fill('-')
          });
        });

        attendance.forEach(record => {
          if (studentMap.has(record.student_id)) {
            const student = studentMap.get(record.student_id);
            const dateParts = record.attendance_date.split('T')[0].split('-');
            const recordDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
            recordDate.setHours(0, 0, 0, 0);

            const sDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            sDate.setHours(0, 0, 0, 0);

            let dayIndex = 0;

            if (this.selectedPeriod === 'WEEK') {
              const diffTime = recordDate.getTime() - sDate.getTime();
              dayIndex = Math.round(diffTime / (1000 * 60 * 60 * 24));
            } else {
              dayIndex = recordDate.getDate() - 1;
            }

            if (dayIndex >= 0 && dayIndex < daysCount) {
              const phaseId = record.phase_id || record.phase?.id;
              const phaseName = record.phase?.phase_name?.toLowerCase();

              if (phaseId === this.morningPhaseId || phaseName === 'morning') {
                student.morningStatus[dayIndex] = record.status;
              } else if (phaseId === this.afternoonPhaseId || phaseName === 'afternoon') {
                student.afternoonStatus[dayIndex] = record.status;
              } else {
                // Fallback: Try to populate morning first, then afternoon
                if (student.morningStatus[dayIndex] === '-') {
                  student.morningStatus[dayIndex] = record.status;
                } else if (student.afternoonStatus[dayIndex] === '-') {
                  student.afternoonStatus[dayIndex] = record.status;
                }
              }
            }
          }
        });

        studentMap.forEach(student => {
          for (let i = 0; i < daysCount; i++) {
            const m = student.morningStatus[i];
            const a = student.afternoonStatus[i];

            if (m === '-' && a === '-') continue;

            const isMPresent = m === 'PRESENT' || m === 'LATE';
            const isMAbsent = m === 'ABSENT';
            const isAPresent = a === 'PRESENT' || a === 'LATE';
            const isAAbsent = a === 'ABSENT';

            if (isMPresent && isAPresent) {
              student.attendanceStatus[i] = 'present';
            } else if (isMAbsent && isAAbsent) {
              student.attendanceStatus[i] = 'leave';
            } else if (isMPresent && isAAbsent) {
              // Afternoon leave
              student.attendanceStatus[i] = 'half_day_afternoon';
            } else if (isMAbsent && isAPresent) {
              // Morning leave
              student.attendanceStatus[i] = 'half_day_morning';
            } else if (isMPresent || isAPresent) {
              student.attendanceStatus[i] = 'present';
            } else if (isMAbsent || isAAbsent) {
              student.attendanceStatus[i] = 'leave';
            }
          }
        });

        const currentCheckDate = new Date(startDate);
        for (let i = 0; i < daysCount; i++) {
          const dayOfWeek = currentCheckDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            studentMap.forEach(student => {
              if (student.attendanceStatus[i] === '-') {
                student.attendanceStatus[i] = 'weekend';
              }
            });
          }
          currentCheckDate.setDate(currentCheckDate.getDate() + 1);
        }

        this.rangeAttendanceData = Array.from(studentMap.values());
        this.isLoading = false;
      },
      error: () => {
        this.showNotification('Error loading range attendance');
        this.isLoading = false;
      }
    });
  }

  getRangeDates() {
    const d = new Date(this.selectedDate);
    d.setHours(0, 0, 0, 0);
    let startDate = new Date(d);
    let endDate = new Date(d);
    let daysCount = 0;

    if (this.selectedPeriod === 'WEEK') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(d.setDate(diff));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      daysCount = 7;
    } else {
      startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      daysCount = endDate.getDate();
    }

    return { startDate, endDate, daysCount };
  }

  trackByDay(index: number, item: any) {
    return index;
  }

  // Helper to format time
  private formatTime12Hour(time24: string): string {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${suffix}`;
  }

  async handleEdit(row: any) {
    const showAfternoon = !!row.afternoon_status && row.afternoon_status !== '-';

    // Parse existing late time if any
    let defaultTime = '09:00';
    if (row.late_status && row.late_status !== '-') {
      // Trying to convert "10:30 AM" to "10:30"
      const timeMatch = row.late_status.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        let m = timeMatch[2];
        let ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : '';
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        defaultTime = `${h.toString().padStart(2, '0')}:${m}`;
      }
    } else {
      const now = new Date();
      defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    let htmlContent = `<div style="display: flex; flex-direction: column; gap: 20px; text-align: left; margin-top: 15px;">
           <div style="display: flex; flex-direction: column; gap: 6px;">
             <label style="margin: 0; font-weight: 500; color: #444; font-size: 14px;">Morning Status</label>
             <select id="swal-input1" ${row.morning_status !== '-' && row.morning_status && (row.afternoon_status === '-' || !row.afternoon_status) ? 'disabled' : ''} style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; color: #1f2937; background-color: #f9fafb; outline: none; box-sizing: border-box; cursor: pointer; ${row.morning_status !== '-' && row.morning_status && (row.afternoon_status === '-' || !row.afternoon_status) ? 'opacity: 0.7;' : ''}">
               <option value="PRESENT" ${row.morning_status === 'PRESENT' ? 'selected' : ''}>Present</option>
               <option value="ABSENT" ${row.morning_status === 'ABSENT' ? 'selected' : ''}>Absent</option>
               <option value="LATE" ${row.morning_status === 'LATE' ? 'selected' : ''}>Late</option>
             </select>
             <div id="time-container1" style="display: ${row.morning_status === 'LATE' ? 'block' : 'none'}; margin-top: 10px;">
               <label style="margin: 0; font-weight: 500; color: #444; font-size: 14px;">Arrival Time</label>
               <input type="time" id="swal-time1" value="${defaultTime}" ${row.morning_status !== '-' && row.morning_status && (row.afternoon_status === '-' || !row.afternoon_status) ? 'disabled' : ''} style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; color: #1f2937; background-color: #f9fafb; outline: none; box-sizing: border-box; cursor: pointer; margin-top: 4px; ${row.morning_status !== '-' && row.morning_status && (row.afternoon_status === '-' || !row.afternoon_status) ? 'opacity: 0.7;' : ''}">
             </div>
           </div>`;

    if (showAfternoon) {
      htmlContent += `
           <div style="display: flex; flex-direction: column; gap: 6px;">
             <label style="margin: 0; font-weight: 500; color: #444; font-size: 14px;">Afternoon Status</label>
             <select id="swal-input2" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; color: #1f2937; background-color: #f9fafb; outline: none; box-sizing: border-box; cursor: pointer;">
               ${row.afternoon_status === '-' || !row.afternoon_status ? '<option value="-" selected disabled>Not Marked</option>' : ''}
               <option value="PRESENT" ${row.afternoon_status === 'PRESENT' ? 'selected' : ''}>Present</option>
               <option value="ABSENT" ${row.afternoon_status === 'ABSENT' ? 'selected' : ''}>Absent</option>
               <option value="LATE" ${row.afternoon_status === 'LATE' ? 'selected' : ''}>Late</option>
             </select>
             <div id="time-container2" style="display: ${row.afternoon_status === 'LATE' ? 'block' : 'none'}; margin-top: 10px;">
               <label style="margin: 0; font-weight: 500; color: #444; font-size: 14px;">Arrival Time</label>
               <input type="time" id="swal-time2" value="${defaultTime}" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; color: #1f2937; background-color: #f9fafb; outline: none; box-sizing: border-box; cursor: pointer; margin-top: 4px;">
             </div>
           </div>`;
    }

    htmlContent += `</div>`;

    const { value: formValues } = await Swal.fire({
      title: `<h3 style="margin:0; padding-bottom: 12px; border-bottom: 1px solid #eaeaea; font-size: 22px; font-weight: 600; color: #202124; text-align: left;">Edit Attendance</h3>`,
      html: htmlContent,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#6750a4',
      cancelButtonColor: '#ef4444',
      width: '450px',
      padding: '1.5em',
      didOpen: () => {
        const select1 = document.getElementById('swal-input1') as HTMLSelectElement;
        const timeContainer1 = document.getElementById('time-container1') as HTMLDivElement;
        if (select1 && timeContainer1) {
          select1.addEventListener('change', (e: any) => {
            timeContainer1.style.display = e.target.value === 'LATE' ? 'block' : 'none';
          });
        }

        const select2 = document.getElementById('swal-input2') as HTMLSelectElement;
        const timeContainer2 = document.getElementById('time-container2') as HTMLDivElement;
        if (select2 && timeContainer2) {
          select2.addEventListener('change', (e: any) => {
            timeContainer2.style.display = e.target.value === 'LATE' ? 'block' : 'none';
          });
        }
      },
      preConfirm: () => {
        const select1 = document.getElementById('swal-input1') as HTMLSelectElement;
        const select2 = document.getElementById('swal-input2') as HTMLSelectElement;
        const time1 = document.getElementById('swal-time1') as HTMLInputElement;
        const time2 = document.getElementById('swal-time2') as HTMLInputElement;

        let formattedTime1 = time1 ? this.formatTime12Hour(time1.value) : '';
        let formattedTime2 = time2 ? this.formatTime12Hour(time2.value) : '';

        return [
          select1 ? select1.value : row.morning_status,
          select2 ? select2.value : row.afternoon_status,
          select1 && select1.value === 'LATE' ? formattedTime1 : null,
          select2 && select2.value === 'LATE' ? formattedTime2 : null
        ];
      }
    });

    if (formValues) {
      const newMorning = formValues[0];
      const newAfternoon = formValues[1];
      const newMorningLateTime = formValues[2];
      const newAfternoonLateTime = formValues[3];

      const requests = [];
      const dateStr = this.selectedDate.toISOString();

      // Check changes
      const morningChanged = newMorning !== row.morning_status || (newMorning === 'LATE' && newMorningLateTime !== row.late_status);
      const afternoonChanged = newAfternoon !== row.afternoon_status || (newAfternoon === 'LATE' && newAfternoonLateTime !== row.late_status);

      // Update locally
      row.morning_status = newMorning;
      row.afternoon_status = newAfternoon;

      if (newMorning === 'LATE' && newMorningLateTime) {
        row.late_status = newMorningLateTime;
      } else if (newAfternoon === 'LATE' && newAfternoonLateTime) {
        row.late_status = newAfternoonLateTime;
      } else {
        this.updateLateTime(row);
      }

      if (morningChanged && newMorning) {
        requests.push(this.attendanceService.markAttendance({
          grade_id: this.selectedGradeId,
          section_id: this.selectedSectionId || undefined,
          phase_id: this.morningPhaseId,
          attendance_date: dateStr,
          records: [{ student_id: row.student_id, status: newMorning as any }]
        }));
      }

      if (afternoonChanged && newAfternoon) {
        requests.push(this.attendanceService.markAttendance({
          grade_id: this.selectedGradeId,
          section_id: this.selectedSectionId || undefined,
          phase_id: this.afternoonPhaseId,
          attendance_date: dateStr,
          records: [{ student_id: row.student_id, status: newAfternoon as any }]
        }));
      }

      if (requests.length > 0) {
        this.isLoading = true;
        forkJoin(requests).subscribe({
          next: () => {
            this.updateAfternoonVisibility();
            this.dataSource._updateChangeSubscription();
            this.isLoading = false;
            this.showNotification('Saved changes successfully', 'snackbar-success');
          },
          error: () => {
            this.isLoading = false;
            this.showNotification('Failed to save attendance directly.');
          }
        });
      } else {
        this.updateAfternoonVisibility();
        this.dataSource._updateChangeSubscription();
        if (newMorning === '' || newAfternoon === '') {
          this.showNotification('Status cleared locally. Click Save All Changes to persist if supported.');
        }
      }
    }
  }

  handleDelete(row: any) {
    row.status = 'ABSENT';
    this.hasChanges = true;
    this.dataSource._updateChangeSubscription();
    this.showNotification('Marked Absent. Remember to click Save All Changes.');
  }

  handleBulkDelete(selectedRows: any[]) {
    selectedRows.forEach(row => row.status = 'ABSENT');
    if (selectedRows.length > 0) this.hasChanges = true;
    this.dataSource._updateChangeSubscription();
    this.showNotification(`Marked ${selectedRows.length} as Absent. Remember to click Save All Changes.`);
  }

  showNotification(message: string, colorClass: string = '') {
    const config: any = { duration: 3000, horizontalPosition: 'center', verticalPosition: 'bottom' };
    if (colorClass) {
      config.panelClass = colorClass;
    }
    this.snackBar.open(message, 'Close', config);
  }
}
