import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, forkJoin, of } from 'rxjs';
import { StudentAttendanceService } from './student-attendance.service';
import { rowsAnimation } from '@shared';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MasterTableComponent, ColumnDefinition } from '@shared/components/master-table/master-table.component';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.scss'],
  animations: [rowsAnimation],
  standalone: true,
  imports: [
    BreadcrumbComponent, 
    MasterTableComponent,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
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

  isLoading = false;
  isSaving = false;
  hasChanges = false;
  private destroy$ = new Subject<void>();

  phases: any[] = [];
  selectedDate: Date = new Date();
  
  isClassTeacher = false;
  classTeacherMessage = '';
  selectedGradeId = '';
  selectedSectionId = '';

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
        'PRESENT': 'badge-solid-green',
        'ABSENT': 'badge-solid-red',
        'LATE': 'badge-solid-orange',
        'EXCUSED': 'badge-solid-blue'
      }
    },
    { 
      def: 'afternoon_status', 
      label: 'Afternoon', 
      type: 'checkbox', 
      visible: true,
      statusBadgeMap: {
        'PRESENT': 'badge-solid-green',
        'ABSENT': 'badge-solid-red',
        'LATE': 'badge-solid-orange',
        'EXCUSED': 'badge-solid-blue'
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
    this.attendanceService.getMyAssignments().subscribe({
      next: (assignments) => {
        const classTeacherAssignment = assignments.find(a => a.assignment_type === 'CLASS_TEACHER');
        if (classTeacherAssignment) {
          this.isClassTeacher = true;
          this.selectedGradeId = classTeacherAssignment.grade_id;
          this.selectedSectionId = classTeacherAssignment.section_id || '';
          this.classTeacherMessage = `Class Teacher for ${classTeacherAssignment.grade?.name} ${classTeacherAssignment.section?.name ? '- ' + classTeacherAssignment.section.name : ''}`;
          this.handleRefresh();
        } else {
          this.isClassTeacher = false;
          this.classTeacherMessage = 'You are not assigned as a Class Teacher. Attendance tracking is restricted.';
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

    this.isLoading = true;
    const dateStr = this.selectedDate.toISOString().split('T')[0];

    let enrollUrl = `${environment.apiUrl}/student-enrollments?grade_id=${this.selectedGradeId}`;
    if (this.selectedSectionId) enrollUrl += `&section_id=${this.selectedSectionId}`;

    this.httpClient.get<any[]>(enrollUrl).subscribe({
      next: (enrollments) => {
        if (!this.morningPhaseId || !this.afternoonPhaseId) {
          const data = enrollments.map((e, index) => ({
            sno: index + 1,
            id: e.student_id,
            student_id: e.student_id,
            name: e.student.name,
            roll_number: e.student.roll_number,
            morning_status: '',
            afternoon_status: '',
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
                morning_status: mExisting ? mExisting.status : '',
                afternoon_status: aExisting ? aExisting.status : '',
                late_status: lateTime
              };
            });
            this.dataSource.data = data;
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

  get dynamicColumnDefinitions() {
    const isMorningDone = this.isMorningComplete();
    
    const afternoonCol = this.columnDefinitions.find(c => c.def === 'afternoon_status');
    if (afternoonCol) {
      afternoonCol.type = isMorningDone ? 'checkbox' : 'status';
    }
    
    return this.columnDefinitions;
  }

  get currentPhaseColumn(): string {
    return this.isMorningComplete() ? 'afternoon_status' : 'morning_status';
  }

  hasAnySelection(): boolean {
    return this.dataSource.data.some(row => 
      row['_selected_morning_status'] || row['_selected_afternoon_status']
    );
  }

  hasAnyMarked(): boolean {
    if (!this.dataSource || !this.dataSource.data) return false;
    const colName = this.currentPhaseColumn;
    return this.dataSource.data.some(row => !!row[colName]);
  }

  isMorningComplete(): boolean {
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) return false;
    return this.dataSource.data.every(row => !!row.morning_status);
  }

  isAfternoonComplete(): boolean {
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) return false;
    return this.dataSource.data.every(row => !!row.afternoon_status);
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
      if (!row[colName]) {
        row[colName] = status;
        this.updateLateTime(row);
        changed = true;
        this.hasChanges = true;
      }
    });

    if (changed) {
      this.dataSource._updateChangeSubscription();
      this.showNotification(`Unmarked students have been set to ${status}.`);
    } else {
      this.showNotification('All students are already marked.');
    }
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
               <option value="EXCUSED" ${row.morning_status === 'EXCUSED' ? 'selected' : ''}>Excused</option>
               <option value="" ${!row.morning_status ? 'selected' : ''}>Not Marked</option>
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
               <option value="EXCUSED" ${row.afternoon_status === 'EXCUSED' ? 'selected' : ''}>Excused</option>
               <option value="" ${!row.afternoon_status ? 'selected' : ''}>Not Marked</option>
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
