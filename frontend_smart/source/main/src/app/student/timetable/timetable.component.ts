import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

interface TimetableItem {
  subject: string;
  time: string;
  room: string;
  teacher: string;
  type: string;
  colorClass: string;
  icon: string;
}

interface DaySchedule {
  day: string;
  date: string;
  items: TimetableItem[];
}

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss'],
  imports: [BreadcrumbComponent, CommonModule],
})
export class TimetableComponent {
  breadscrums = [
    {
      title: 'Timetable',
      items: ['Student'],
      active: 'Timetable',
    },
  ];

  timetableData: DaySchedule[] = [
    {
      day: 'Monday',
      date: 'Dec 30',
      items: [
        {
          subject: 'Chemistry',
          time: '10:00 AM - 10:45 AM',
          room: '101',
          teacher: 'Dr. Sarah Wilson',
          type: 'Lecture',
          colorClass: 'bg-green',
          icon: 'fas fa-flask',
        },
        {
          subject: 'English',
          time: '10:45 AM - 11:30 AM',
          room: '101',
          teacher: 'Ms. Emily Bond',
          type: 'Seminar',
          colorClass: 'bg-orange',
          icon: 'fas fa-book',
        },
        {
          subject: 'Physics',
          time: '11:30 AM - 12:15 PM',
          room: '101',
          teacher: 'Mr. John Miller',
          type: 'Lab',
          colorClass: 'bg-blue',
          icon: 'fas fa-atom',
        },
      ],
    },
    {
      day: 'Tuesday',
      date: 'Dec 31',
      items: [
        {
          subject: 'Computer',
          time: '01:00 PM - 01:45 PM',
          room: 'Lab 2',
          teacher: 'Mr. David Chen',
          type: 'Practice',
          colorClass: 'bg-purple',
          icon: 'fas fa-laptop-code',
        },
        {
          subject: 'Mathematics',
          time: '01:45 PM - 02:30 PM',
          room: '202',
          teacher: 'Dr. Alex Brown',
          type: 'Lecture',
          colorClass: 'bg-indigo',
          icon: 'fas fa-square-root-alt',
        },
      ],
    },
    {
      day: 'Wednesday',
      date: 'Jan 01',
      items: [
        {
          subject: 'Geography',
          time: '09:00 AM - 09:45 AM',
          room: '301',
          teacher: 'Mrs. Olivia White',
          type: 'Lecture',
          colorClass: 'bg-teal',
          icon: 'fas fa-globe-americas',
        },
        {
          subject: 'History',
          time: '10:00 AM - 10:45 AM',
          room: '105',
          teacher: 'Mr. Robert King',
          type: 'Seminar',
          colorClass: 'bg-brown',
          icon: 'fas fa-monument',
        },
      ],
    },
    {
      day: 'Thursday',
      date: 'Jan 02',
      items: [
        {
          subject: 'Biology',
          time: '11:00 AM - 11:45 AM',
          room: 'Bio Lab',
          teacher: 'Dr. Maria Garcia',
          type: 'Lab',
          colorClass: 'bg-pink',
          icon: 'fas fa-dna',
        },
        {
          subject: 'Chemistry',
          time: '12:00 PM - 12:45 PM',
          room: '101',
          teacher: 'Dr. Sarah Wilson',
          type: 'Lecture',
          colorClass: 'bg-green',
          icon: 'fas fa-flask',
        },
      ],
    },
    {
      day: 'Friday',
      date: 'Jan 03',
      items: [
        {
          subject: 'Art',
          time: '02:00 PM - 03:30 PM',
          room: 'Studio A',
          teacher: 'Ms. Sophie Turner',
          type: 'Studio',
          colorClass: 'bg-amber',
          icon: 'fas fa-palette',
        },
      ],
    },
    {
      day: 'Saturday',
      date: 'Jan 04',
      items: [
        {
          subject: 'Physical Education',
          time: '08:30 AM - 10:00 AM',
          room: 'Main Gym',
          teacher: 'Coach Mike Ross',
          type: 'Practice',
          colorClass: 'bg-red',
          icon: 'fas fa-running',
        },
      ],
    },
  ];

  constructor() {}
}
