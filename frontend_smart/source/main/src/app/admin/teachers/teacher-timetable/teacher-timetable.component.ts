import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  TimetableResponse,
  Teacher,
  TeacherTimetable,
} from './teacher-timetable..interface';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TeacherTimetableService } from './teacher-timetable.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-teacher-timetable',
    imports: [
        BreadcrumbComponent,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        CommonModule,
        MatIconModule,
        MatInputModule,
    ],
    templateUrl: './teacher-timetable.component.html',
    styleUrl: './teacher-timetable.component.scss'
})
export class TeacherTimetableComponent implements OnInit {
  private teacherTimetableService = inject(TeacherTimetableService);

  breadscrums = [
    {
      title: 'Teacher Timetable',
      items: ['Teacher'],
      active: 'Teacher Timetable',
    },
  ];
  weekDays: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  timetableData: TeacherTimetable[] = [];
  availableTeachers: Teacher[] = [];
  selectedTeacher: FormControl<string | null>;

  constructor() {
    this.selectedTeacher = new FormControl<string | null>(null);
  }

  ngOnInit(): void {
    this.loadAvailableTeachers();
    this.selectedTeacher.valueChanges.subscribe((teacherId) => {
      if (teacherId) {
        this.loadTimeTable(teacherId);
      }
    });
  }

  loadAvailableTeachers(): void {
    // Using forkJoin to get both teachers and timetable data
    forkJoin({
      teachers: this.teacherTimetableService.getTeachers(),
      timeTables: this.teacherTimetableService.getTimetable(),
    }).subscribe({
      next: (data) => {
        // Get the teacher IDs that have timetable
        const teacherIdsWithTimeTable = Object.keys(data.timeTables);

        // Filter teachers to only include those with timetable
        this.availableTeachers = data.teachers.filter((teacher) =>
          teacherIdsWithTimeTable.includes(teacher.id)
        );

        // If there are available teachers, select the first one by default
        if (this.availableTeachers.length > 0) {
          this.selectedTeacher.setValue(this.availableTeachers[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading teachers and timetable:', error);
      },
    });
  }

  loadTimeTable(teacherId: string): void {
    this.teacherTimetableService.getTimetable().subscribe({
      next: (timetableData: TimetableResponse) => {
        this.timetableData = timetableData[teacherId] || [];
      },
      error: (error) => {
        console.error('Error loading timetable:', error);
      },
    });
  }

  getTimeTableForDay(day: string): TeacherTimetable | undefined {
    return this.timetableData.find((timeTable) => timeTable.day === day);
  }

  isTimeTableEmpty(day: string): boolean {
    const dayTimeTable = this.getTimeTableForDay(day);
    return !dayTimeTable || dayTimeTable.schedules.length === 0;
  }
}
