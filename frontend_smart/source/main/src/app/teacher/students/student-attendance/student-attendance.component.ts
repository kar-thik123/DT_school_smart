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
      statusBadgeMap: {
        'PRESENT': 'col-green',
        'ABSENT': 'col-red',
        'LATE': 'col-orange',
        'EXCUSED': 'col-blue'
      },
      statusIconMap: {
        'PRESENT': 'check_circle_outline',
        'ABSENT': 'highlight_off',
        'LATE': 'schedule',
        'EXCUSED': 'info_outline'
      }
    },
    { 
      def: 'afternoon_status', 
      label: 'Afternoon', 
      type: 'checkbox', 
      visible: true,
      statusBadgeMap: {
        'PRESENT': 'col-green',
        'ABSENT': 'col-red',
        'LATE': 'col-orange',
        'EXCUSED': 'col-blue'
      },
      statusIconMap: {
        'PRESENT': 'check_circle_outline',
        'ABSENT': 'highlight_off',
        'LATE': 'schedule',
        'EXCUSED': 'info_outline'
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
        this.classTeacherMessage = 'Error loading your assignments.';
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
    const dateStr = this.selectedDate.toISOString().split('T')[0];

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
              if (mExisting?.status === 'LATE' && mExisting?.remarks) {
                lateTime = mExisting.remarks;
              } else if (aExisting?.status === 'LATE' && aExisting?.remarks) {
                lateTime = aExisting.remarks;
              }

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

  saveAttendance() {
    if (!this.dataSource.data.length) return;
    if (!this.morningPhaseId || !this.afternoonPhaseId) {
      this.showNotification('Morning/Afternoon phases not configured. Please contact Administration.');
      return;
    }

    this.isSaving = true;
    const dateStr = this.selectedDate.toISOString();

    const morningPayload = {
      grade_id: this.selectedGradeId,
      section_id: this.selectedSectionId || undefined,
      phase_id: this.morningPhaseId,
      attendance_date: dateStr,
      records: this.dataSource.data.map(s => ({
        student_id: s.student_id,
        status: s.morning_status,
        remarks: s.morning_status === 'LATE' && s.late_status !== '-' ? s.late_status : undefined
      })).filter(s => s.status !== '')
    };

    const afternoonPayload = {
      grade_id: this.selectedGradeId,
      section_id: this.selectedSectionId || undefined,
      phase_id: this.afternoonPhaseId,
      attendance_date: dateStr,
      records: this.dataSource.data.map(s => ({
        student_id: s.student_id,
        status: s.afternoon_status,
        remarks: s.afternoon_status === 'LATE' && s.late_status !== '-' ? s.late_status : undefined
      })).filter(s => s.status !== '')
    };

    const payloads = [
      this.attendanceService.markAttendance(morningPayload),
      this.attendanceService.markAttendance(afternoonPayload)
    ];

    forkJoin(payloads).subscribe({
      next: () => {
        this.isSaving = false;
        this.hasChanges = false;
        this.showNotification('Attendance saved successfully');
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
    return this.dataSource.data.some(row => !!row[colName]);
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
      this.dataSource._updateChangeSubscription();
      this.showNotification('Morning status copied to Afternoon.');
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
    const excusedCount = this.dataSource.data.filter(r => r[colName] === 'EXCUSED').length;
    
    if (presentCount > 0 && absentCount === 0 && lateCount === 0 && excusedCount === 0) {
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

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

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
            attendanceStatus: new Array(daysCount).fill('-')
          });
        });

        attendance.forEach(record => {
          if (studentMap.has(record.student_id)) {
            const student = studentMap.get(record.student_id);
            const recordDate = new Date(record.attendance_date);
            recordDate.setHours(0, 0, 0, 0);
            const sDate = new Date(startDate);
            sDate.setHours(0, 0, 0, 0);
            
            let dayIndex = 0;

            if (this.selectedPeriod === 'WEEK') {
              const diffTime = recordDate.getTime() - sDate.getTime();
              dayIndex = Math.round(diffTime / (1000 * 60 * 60 * 24));
            } else {
              dayIndex = recordDate.getDate() - 1;
            }

            if (dayIndex >= 0 && dayIndex < daysCount) {
              let statusStr = '-';
              if (record.status === 'PRESENT') statusStr = 'present';
              else if (record.status === 'ABSENT') statusStr = 'leave';
              else if (record.status === 'LATE') statusStr = 'present';
              else if (record.status === 'EXCUSED') statusStr = 'leave';

              if (student.attendanceStatus[dayIndex] === '-' || student.attendanceStatus[dayIndex] === 'leave') {
                student.attendanceStatus[dayIndex] = statusStr;
              }
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

  async handleEdit(row: any) {
    const showAfternoon = this.isMorningComplete();
    
    let htmlContent = `<div style="display: flex; flex-direction: column; gap: 20px; text-align: left; margin-top: 15px;">
           <div style="display: flex; flex-direction: column; gap: 6px;">
             <label style="margin: 0; font-weight: 500; color: #444; font-size: 14px;">Morning Status</label>
             <select id="swal-input1" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; color: #1f2937; background-color: #f9fafb; outline: none; box-sizing: border-box; cursor: pointer;">
               <option value="PRESENT" ${row.morning_status === 'PRESENT' ? 'selected' : ''}>Present</option>
               <option value="ABSENT" ${row.morning_status === 'ABSENT' ? 'selected' : ''}>Absent</option>
               <option value="LATE" ${row.morning_status === 'LATE' ? 'selected' : ''}>Late</option>
             </select>
           </div>`;

    if (showAfternoon) {
      htmlContent += `
           <div style="display: flex; flex-direction: column; gap: 6px;">
             <label style="margin: 0; font-weight: 500; color: #444; font-size: 14px;">Afternoon Status</label>
             <select id="swal-input2" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 15px; color: #1f2937; background-color: #f9fafb; outline: none; box-sizing: border-box; cursor: pointer;">
               <option value="PRESENT" ${row.afternoon_status === 'PRESENT' ? 'selected' : ''}>Present</option>
               <option value="ABSENT" ${row.afternoon_status === 'ABSENT' ? 'selected' : ''}>Absent</option>
               <option value="LATE" ${row.afternoon_status === 'LATE' ? 'selected' : ''}>Late</option>
             </select>
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
      preConfirm: () => {
        const select1 = document.getElementById('swal-input1') as HTMLSelectElement;
        const select2 = document.getElementById('swal-input2') as HTMLSelectElement;
        return [
          select1 ? select1.value : row.morning_status,
          select2 ? select2.value : row.afternoon_status
        ]
      }
    });

    if (formValues) {
      const newMorning = formValues[0];
      const newAfternoon = formValues[1];
      
      const requests = [];
      const dateStr = this.selectedDate.toISOString();
      
      // Check changes
      const morningChanged = newMorning !== row.morning_status;
      const afternoonChanged = newAfternoon !== row.afternoon_status;

      // Update locally
      row.morning_status = newMorning;
      row.afternoon_status = newAfternoon;
      this.updateLateTime(row);

      if (morningChanged && newMorning) {
        requests.push(this.attendanceService.markAttendance({
          grade_id: this.selectedGradeId,
          section_id: this.selectedSectionId || undefined,
          phase_id: this.morningPhaseId,
          attendance_date: dateStr,
          records: [{ student_id: row.student_id, status: newMorning as any, remarks: newMorning === 'LATE' ? row.late_status : undefined }]
        }));
      }

      if (afternoonChanged && newAfternoon) {
        requests.push(this.attendanceService.markAttendance({
          grade_id: this.selectedGradeId,
          section_id: this.selectedSectionId || undefined,
          phase_id: this.afternoonPhaseId,
          attendance_date: dateStr,
          records: [{ student_id: row.student_id, status: newAfternoon as any, remarks: newAfternoon === 'LATE' ? row.late_status : undefined }]
        }));
      }

      if (requests.length > 0) {
        this.isLoading = true;
        forkJoin(requests).subscribe({
          next: () => {
             this.updateAfternoonVisibility();
             this.dataSource._updateChangeSubscription();
             this.isLoading = false;
             this.showNotification('Attendance saved directly to database.');
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

  showNotification(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000, horizontalPosition: 'center', verticalPosition: 'bottom' });
  }
}
