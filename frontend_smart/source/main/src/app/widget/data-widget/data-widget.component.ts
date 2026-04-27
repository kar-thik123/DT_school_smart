import { Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { NgScrollbar } from 'ngx-scrollbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ActivityListComponent } from '@shared/components/activity-list/activity-list.component';
import { AssignTaskComponent } from '@shared/components/assign-task/assign-task.component';
import {
  ChatWidgetComponent,
  Message,
} from '@shared/components/chat-widget/chat-widget.component';
import { DocumentListComponent } from '@shared/components/document-list/document-list.component';
import { EarningSourceComponent } from '@shared/components/earning-source/earning-source.component';
import { EmpTaskTabComponent } from '@shared/components/emp-task-tab/emp-task-tab.component';
import {
  LatestPostComponent,
  Post,
} from '@shared/components/latest-post/latest-post.component';
import {
  Medicine,
  MedicineListComponent,
} from '@shared/components/medicine-list/medicine-list.component';
import { NewOrderListComponent } from '@shared/components/new-order-list/new-order-list.component';
import {
  ProgressTableComponent,
  SubjectProgress,
} from '@shared/components/progress-table/progress-table.component';
import { RecentActivityComponent } from '@shared/components/recent-activity/recent-activity.component';
import { RecentCommentsComponent } from '@shared/components/recent-comments/recent-comments.component';
import { ReportCardWidgetComponent } from '@shared/components/report-card-widget/report-card-widget.component';
import { ReviewWidgetComponent } from '@shared/components/review-widget/review-widget.component';
import {
  TimelineItem,
  TimelineListComponent,
} from '@shared/components/timeline-list/timeline-list.component';
import { TodoWidgetComponent } from '@shared/components/todo-widget/todo-widget.component';
import { MatCardModule } from '@angular/material/card';
import { EmpScheduleComponent } from '@shared/components/emp-schedule/emp-schedule.component';
import { EventCardComponent } from '@shared/components/event-card/event-card.component';
import { ScheduleCardComponent } from '@shared/components/schedule-card/schedule-card.component';
import { EmpStatusComponent } from '@shared/components/emp-status/emp-status.component';
import { NoticeboardComponent } from '@shared/components/noticeboard/noticeboard.component';
import { ProjectHoursComponent } from '@shared/components/project-hours/project-hours.component';
import { EnhancedEventsCardComponent } from '@shared/components/enhanced-events-card/enhanced-events-card.component';
import { TeacherActivityTrackerComponent } from '@shared/components/teacher-activity-tracker/teacher-activity-tracker.component';
import { NoticeboardAnnouncementsComponent } from '@shared/components/noticeboard-announcements/noticeboard-announcements.component';
import { AttendanceOverviewComponent } from '@shared/components/attendance-overview/attendance-overview.component';
import { QuickNotesPanelComponent } from '@shared/components/quick-notes-panel/quick-notes-panel.component';
import { TopStudentsCardComponent } from '@shared/components/top-students-card/top-students-card.component';
import { MessageCenterComponent } from '@shared/components/message-center/message-center.component';
import { ClassScheduleCardComponent } from '@shared/components/class-schedule-card/class-schedule-card.component';
import { UpcomingAssignmentsComponent } from '@shared/components/upcoming-assignments/upcoming-assignments.component';
import { RecentGradesComponent } from '@shared/components/recent-grades/recent-grades.component';

interface Task {
  userImage: string;
  userName: string;
  taskDetails: string;
  status: string;
  statusClass: string;
  manager: string;
  progress: number;
  progressClass: string;
}

interface Todo {
  title: string;
  done: boolean;
  priority: 'Low' | 'Normal' | 'High';
}

@Component({
  selector: 'app-data-widget',
  templateUrl: './data-widget.component.html',
  styleUrls: ['./data-widget.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatProgressBarModule,
    NgScrollbar,
    MatButtonModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    ProgressTableComponent,
    DocumentListComponent,
    EmpScheduleComponent,
    ReviewWidgetComponent,
    EarningSourceComponent,
    ActivityListComponent,
    AssignTaskComponent,
    NewOrderListComponent,
    EmpTaskTabComponent,
    RecentActivityComponent,
    ChatWidgetComponent,
    LatestPostComponent,
    RecentCommentsComponent,
    TimelineListComponent,
    TodoWidgetComponent,
    MedicineListComponent,
    ReportCardWidgetComponent,
    EventCardComponent,
    ScheduleCardComponent,
    EmpStatusComponent,
    NoticeboardComponent,
    ProjectHoursComponent,
    EnhancedEventsCardComponent,
    TeacherActivityTrackerComponent,
    NoticeboardAnnouncementsComponent,
    AttendanceOverviewComponent,
    QuickNotesPanelComponent,
    TopStudentsCardComponent,
    MessageCenterComponent,
    ClassScheduleCardComponent,
    UpcomingAssignmentsComponent,
    RecentGradesComponent,
  ],
})
export class DataWidgetComponent {
  breadscrums = [
    {
      title: 'Data Widget',
      items: ['Widget'],
      active: 'Data Widget',
    },
  ];

  constructor() {
    //constructor
  }

  // Progress table data

  subjects: SubjectProgress[] = [
    { subject: 'Chemistry', progress: 30, duration: '2 Months' },
    { subject: 'Mathematics', progress: 55, duration: '3 Months' },
    { subject: 'Painting', progress: 67, duration: '1 Month' },
    { subject: 'Business Studies', progress: 70, duration: '2 Months' },
    { subject: 'Biology', progress: 24, duration: '3 Months' },
    { subject: 'Computer Studies', progress: 77, duration: '4 Months' },
    { subject: 'Geography', progress: 41, duration: '2 Months' },
  ];

  // document list

  documentList = [
    {
      title: 'Java Programming',
      type: '.doc',
      size: 4.3,
      icon: 'far fa-file-word',
      iconClass: 'primary-rgba text-primary',
      textClass: '',
    },
    {
      title: 'Angular Theory',
      type: '.xls',
      size: 2.5,
      icon: 'far fa-file-excel',
      iconClass: 'success-rgba text-success',
      textClass: '',
    },
    {
      title: 'Maths Sums Solution',
      type: '.pdf',
      size: 10.5,
      icon: 'far fa-file-pdf',
      iconClass: 'danger-rgba text-danger',
      textClass: '',
    },
    {
      title: 'Submit Science Journal',
      type: '.zip',
      size: 53.2,
      icon: 'far fa-file-archive',
      iconClass: 'info-rgba text-info',
      textClass: '',
    },
    {
      title: 'Marketing Instructions',
      type: '.doc',
      size: 5.3,
      icon: 'far fa-file-word',
      iconClass: 'primary-rgba text-primary',
      textClass: '',
    },
  ];

  // schedule

  scheduleList = [
    {
      name: 'Cara Stevens',
      degree: 'Mathematics',
      date: "12 June '20",
      time: '09:00-10:00',
      imageUrl: 'assets/images/user/user1.jpg',
    },
    {
      name: 'Airi Satou',
      degree: 'Computer Studies',
      date: "13 June '20",
      time: '11:00-12:00',
      imageUrl: 'assets/images/user/user2.jpg',
    },
    {
      name: 'Jens Brincker',
      degree: 'Geography',
      date: "15 June '20",
      time: '09:30-10:30',
      imageUrl: 'assets/images/user/user3.jpg',
    },
    {
      name: 'Angelica Ramos',
      degree: 'Chemistry',
      date: "16 June '20",
      time: '14:00-15:00',
      imageUrl: 'assets/images/user/user4.jpg',
    },
    {
      name: 'Cara Stevens',
      degree: 'Painting',
      date: "18 June '20",
      time: '11:00-12:30',
      imageUrl: 'assets/images/user/user5.jpg',
    },
    {
      name: 'Jacob Ryan',
      degree: 'Business Studies',
      date: "22 June '20",
      time: '13:00-14:15',
      imageUrl: 'assets/images/user/user6.jpg',
    },
  ];

  // review list

  reviewList = [
    {
      name: 'Alis Smith',
      timeAgo: 'a week ago',
      rating: 3.5,
      comment:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam vel rutrum ex, at ornare mi. In quis scelerisque dui, eget rhoncus orci. Fusce et sodales ipsum. Nam id nunc euismod, aliquet arcu quis, mattis nisi.',
      imageUrl: 'assets/images/user/user1.jpg',
    },
    {
      name: 'John Dio',
      timeAgo: 'a week ago',
      rating: 2.5,
      comment:
        'Nam quis ligula est. Nunc sed risus non turpis tristique tempor. Ut sollicitudin faucibus magna nec gravida. Suspendisse ullamcorper justo vel porta imperdiet. Nunc nec ipsum vel augue placerat faucibus.',
      imageUrl: 'assets/images/user/user2.jpg',
    },
  ];

  // earning source

  sources = [
    {
      label: 'envato.com',
      percentage: 17,
      class: 'bg-green',
      labelClass: 'bg-green text-white',
    },
    {
      label: 'google.com',
      percentage: 27,
      class: 'bg-red',
      labelClass: 'bg-red text-white',
    },
    {
      label: 'yahoo.com',
      percentage: 25,
      class: 'bg-indigo',
      labelClass: 'bg-indigo text-white',
    },
    {
      label: 'store',
      percentage: 18,
      class: 'bg-orange',
      labelClass: 'bg-orange text-white',
    },
    {
      label: 'Others',
      percentage: 13,
      class: 'bg-dark',
      labelClass: 'bg-dark text-white',
    },
  ];

  // activities

  activities = [
    {
      userImage: 'assets/images/user/user1.jpg',
      userName: 'Sarah Smith',
      label: 'File',
      labelStyle: 'lblFileStyle',
      time: '6 hours ago',
      message: 'hii John, I have upload doc related to task.',
      isActive: true,
    },
    {
      userImage: 'assets/images/user/user2.jpg',
      userName: 'Jalpa Joshi',
      label: 'Task',
      labelStyle: 'lblTaskStyle',
      time: '5 hours ago',
      message: 'Please do as specify. Let me know if you have any query.',
      isActive: false,
    },
    {
      userImage: 'assets/images/user/user3.jpg',
      userName: 'Lina Smith',
      label: 'Comment',
      labelStyle: 'lblCommentStyle',
      time: '6 hours ago',
      message: 'Hey, How are you??',
      isActive: false,
    },
    {
      userImage: 'assets/images/user/user4.jpg',
      userName: 'Jacob Ryan',
      label: 'Reply',
      labelStyle: 'lblReplyStyle',
      time: '7 hours ago',
      message: 'I am fine. You??',
      isActive: true,
    },
    {
      userImage: 'assets/images/user/user5.jpg',
      userName: 'Sarah Smith',
      label: 'File',
      labelStyle: 'lblFileStyle',
      time: '6 hours ago',
      message: 'hii John, I have upload doc related to task.',
      isActive: true,
    },
    {
      userImage: 'assets/images/user/user6.jpg',
      userName: 'Jalpa Joshi',
      label: 'Task',
      labelStyle: 'lblTaskStyle',
      time: '5 hours ago',
      message: 'Please do as specify. Let me know if you have any query.',
      isActive: false,
    },
  ];

  // task

  assignTasks: Task[] = [
    {
      userImage: 'assets/images/user/user1.jpg',
      userName: 'John Deo',
      taskDetails: 'Task A',
      status: 'Doing',
      statusClass: 'bg-green',
      manager: 'John Doe',
      progress: 62,
      progressClass: 'bg-green',
    },
    {
      userImage: 'assets/images/user/user2.jpg',
      userName: 'John Deo',
      taskDetails: 'Task B',
      status: 'To Do',
      statusClass: 'bg-purple',
      manager: 'John Doe',
      progress: 40,
      progressClass: 'bg-purple',
    },
    {
      userImage: 'assets/images/user/user3.jpg',
      userName: 'John Deo',
      taskDetails: 'Task C',
      status: 'On Hold',
      statusClass: 'bg-orange',
      manager: 'John Doe',
      progress: 72,
      progressClass: 'bg-orange',
    },
    {
      userImage: 'assets/images/user/user4.jpg',
      userName: 'John Deo',
      taskDetails: 'Task D',
      status: 'Waiting',
      statusClass: 'bg-cyan',
      manager: 'John Doe',
      progress: 95,
      progressClass: 'bg-cyan',
    },
    {
      userImage: 'assets/images/user/user5.jpg',
      userName: 'John Deo',
      taskDetails: 'Task E',
      status: 'Suspended',
      statusClass: 'bg-green',
      manager: 'John Doe',
      progress: 87,
      progressClass: 'bg-green',
    },
    {
      userImage: 'assets/images/user/user6.jpg',
      userName: 'Jane Smith',
      taskDetails: 'Task F',
      status: 'Doing',
      statusClass: 'bg-green',
      manager: 'John Doe',
      progress: 55,
      progressClass: 'bg-green',
    },
    {
      userImage: 'assets/images/user/user7.jpg',
      userName: 'Emily Johnson',
      taskDetails: 'Task G',
      status: 'To Do',
      statusClass: 'bg-purple',
      manager: 'John Doe',
      progress: 20,
      progressClass: 'bg-purple',
    },
    {
      userImage: 'assets/images/user/user8.jpg',
      userName: 'Michael Brown',
      taskDetails: 'Task H',
      status: 'On Hold',
      statusClass: 'bg-orange',
      manager: 'John Doe',
      progress: 10,
      progressClass: 'bg-orange',
    },
    {
      userImage: 'assets/images/user/user9.jpg',
      userName: 'Sarah Davis',
      taskDetails: 'Task I',
      status: 'Completed',
      statusClass: 'bg-blue',
      manager: 'John Doe',
      progress: 100,
      progressClass: 'bg-blue',
    },
  ];

  // Employee task data

  employeeData = [
    {
      name: 'Sarah Smith',
      imgUrl: 'assets/images/user/user1.jpg',
      tasks: [
        {
          name: 'Task C',
          status: 'Completed',
          statusClass: 'col-green',
          manager: 'John Doe',
          progress: 72,
          progressBarClass: 'l-bg-green',
        },
        {
          name: 'Task A',
          status: 'On Process',
          statusClass: 'col-red',
          manager: 'John Doe',
          progress: 62,
          progressBarClass: 'l-bg-red',
        },
        {
          name: 'Task B',
          status: 'On Hold',
          statusClass: 'col-purple',
          manager: 'John Doe',
          progress: 40,
          progressBarClass: 'l-bg-purple',
        },
        {
          name: 'Task D',
          status: 'Completed',
          statusClass: 'col-green',
          manager: 'John Doe',
          progress: 72,
          progressBarClass: 'l-bg-green',
        },
        {
          name: 'Task E',
          status: 'On Hold',
          statusClass: 'col-purple',
          manager: 'John Doe',
          progress: 40,
          progressBarClass: 'l-bg-purple',
        },
        {
          name: 'Task P',
          status: 'On Hold',
          statusClass: 'col-purple',
          manager: 'John Doe',
          progress: 40,
          progressBarClass: 'l-bg-purple',
        },
        {
          name: 'Task O',
          status: 'On Process',
          statusClass: 'col-red',
          manager: 'John Doe',
          progress: 62,
          progressBarClass: 'l-bg-red',
        },
      ],
    },
    {
      name: 'Jalpa Joshi',
      imgUrl: 'assets/images/user/user2.jpg',
      tasks: [
        {
          name: 'Task D',
          status: 'On Process',
          statusClass: 'col-red',
          manager: 'John Doe',
          progress: 62,
          progressBarClass: 'l-bg-red',
        },
        {
          name: 'Task E',
          status: 'On Hold',
          statusClass: 'col-purple',
          manager: 'John Doe',
          progress: 40,
          progressBarClass: 'l-bg-purple',
        },
        {
          name: 'Task F',
          status: 'Completed',
          statusClass: 'col-green',
          manager: 'John Doe',
          progress: 72,
          progressBarClass: 'l-bg-green',
        },
        {
          name: 'Task G',
          status: 'On Process',
          statusClass: 'col-red',
          manager: 'John Doe',
          progress: 62,
          progressBarClass: 'l-bg-red',
        },
      ],
    },
    {
      name: 'Mark Peter',
      imgUrl: 'assets/images/user/user3.jpg',
      tasks: [
        {
          name: 'Task E',
          status: 'On Hold',
          statusClass: 'col-purple',
          manager: 'John Doe',
          progress: 40,
          progressBarClass: 'l-bg-purple',
        },
        {
          name: 'Task D',
          status: 'On Process',
          statusClass: 'col-red',
          manager: 'John Doe',
          progress: 62,
          progressBarClass: 'l-bg-red',
        },
        {
          name: 'Task F',
          status: 'Completed',
          statusClass: 'col-green',
          manager: 'John Doe',
          progress: 72,
          progressBarClass: 'l-bg-green',
        },
      ],
    },
  ];

  // recent activities

  recentActivities: {
    id: number;
    type: 'message' | 'assignment' | 'attendance' | 'grade' | 'note' | 'system';
    title: string;
    message: string;
    timestamp: Date;
    statusClass: string;
    read: boolean;
    user?: { name: string; avatar?: string };
    relatedEntity?: {
      type: 'class' | 'student' | 'assignment' | 'message';
      id: number;
      name: string;
    };
  }[] = [
    {
      id: 1,
      type: 'message',
      title: 'New Message',
      message:
        'Lorem ipsum dolor sit amet conse ctetur which ascing elit users.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      statusClass: 'sl-primary',
      read: false,
    },
    {
      id: 2,
      type: 'assignment',
      title: 'Assignment Update',
      message:
        'Lorem ipsum dolor sit ametcon the sectetur that ascing elit users.',
      timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 mins ago
      statusClass: 'sl-danger',
      read: false,
    },
    {
      id: 3,
      type: 'attendance',
      title: 'Attendance Update',
      message:
        'Lorem ipsum dolor sit amet cons the ecte tur and adip ascing elit users.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      statusClass: 'sl-success',
      read: true,
    },
    {
      id: 4,
      type: 'grade',
      title: 'Grade Posted',
      message:
        'Lorem ipsum dolor sit amet cons the ecte tur and adip ascing elit users.',
      timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
      statusClass: 'sl-primary',
      read: false,
    },
    {
      id: 5,
      type: 'note',
      title: 'New Note',
      message:
        'Lorem ipsum dolor sit amet conse ctetur which ascing elit users.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      statusClass: 'sl-success',
      read: true,
    },
  ];

  // chat widget

  messages: Message[] = [
    {
      sender: 'Michael',
      text: 'Hi Aiden, how are you? How is the project coming along?',
      time: '10:10 AM',
    },
    {
      sender: 'Aiden',
      text: 'Are we meeting today? Project has been already finished and I have results to show you.',
      time: '10:12 AM',
    },
  ];

  onMessageSent(messageText: string) {
    console.log('Message Sent:', messageText);
  }

  // latest post

  postList: Post[] = [
    {
      image: 'assets/images/posts/post1.jpg',
      title: 'About Something',
      timeAgo: '10 minutes ago',
      description: 'Lorem Ipsum is simply dummy text of the.',
    },
    {
      image: 'assets/images/posts/post2.jpg',
      title: 'Relationship',
      timeAgo: '24 minutes ago',
      description: 'Lorem Ipsum is simply dummy text of the.',
    },
    {
      image: 'assets/images/posts/post3.jpg',
      title: 'Human body',
      timeAgo: '53 minutes ago',
      description: 'Lorem Ipsum is simply dummy text of the.',
    },
  ];

  //recent comments

  comments = [
    {
      name: 'Dr. Airi Satou',
      message: 'Lorem ipsum dolor sit amet, id quo eruditi eloquentiam.',
      timestamp: '7 hours ago',
      imgSrc: 'assets/images/user/user6.jpg',
      colorClass: 'col-green',
    },
    {
      name: 'Dr. Sarah Smith',
      message: 'Lorem ipsum dolor sit amet, id quo eruditi eloquentiam.',
      timestamp: '1 hour ago',
      imgSrc: 'assets/images/user/user4.jpg',
      colorClass: 'color-primary col-indigo',
    },
    {
      name: 'Dr. Cara Stevens',
      message: 'Lorem ipsum dolor sit amet, id quo eruditi eloquentiam.',
      timestamp: 'Yesterday',
      imgSrc: 'assets/images/user/user3.jpg',
      colorClass: 'color-danger col-cyan',
    },
    {
      name: 'Dr. Ashton Cox',
      message: 'Lorem ipsum dolor sit amet, id quo eruditi eloquentiam.',
      timestamp: 'Yesterday',
      imgSrc: 'assets/images/user/user7.jpg',
      colorClass: 'color-info col-orange',
      noBorder: true,
    },
    {
      name: 'Dr. Mark Hay',
      message: 'Lorem ipsum dolor sit amet, id quo eruditi eloquentiam.',
      timestamp: '1 hour ago',
      imgSrc: 'assets/images/user/user9.jpg',
      colorClass: 'color-primary col-red',
    },
  ];

  // timeline list

  timelineData: TimelineItem[] = [
    {
      image: 'assets/images/user/user1.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '5 minutes ago',
    },
    {
      image: 'assets/images/user/user2.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '10 minutes ago',
    },
    {
      image: 'assets/images/user/user8.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '20 minutes ago',
    },
    {
      image: 'assets/images/user/user4.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '35 minutes ago',
    },
    {
      image: 'assets/images/user/user5.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '45 minutes ago',
    },
    {
      image: 'assets/images/user/user7.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '1 hour ago',
    },
    {
      image: 'assets/images/user/user3.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '2 hours ago',
    },
    {
      image: 'assets/images/user/user6.jpg',
      title: 'Lorem ipsum dolor sit amet, id quo eruditi.',
      timeAgo: '3 hours ago',
    },
  ];

  // medicine list

  medicineDataSource: Medicine[] = [
    {
      name: 'Econochlor (chloramphenicol-oral)',
      icon: 'fas fa-tablets col-green',
      dosage: '1 - 0 - 1',
    },
    {
      name: 'Desmopressin tabs',
      icon: 'fas fa-capsules col-red',
      dosage: '1 - 1 - 1',
    },
    {
      name: 'Abciximab-injection',
      icon: 'fas fa-syringe col-blue',
      dosage: '1 Daily',
    },
    {
      name: 'Kevzara sarilumab',
      icon: 'fas fa-pills col-orange',
      dosage: '0 - 0 - 1',
    },
    {
      name: 'Gentamicin-topical',
      icon: 'fas fa-capsules col-purple',
      dosage: '1 - 0 - 1',
    },
    {
      name: 'Paliperidone palmitate',
      icon: 'fas fa-tablets col-teal',
      dosage: '1 - 1 - 1',
    },
    {
      name: 'Sermorelin-injectable',
      icon: 'fas fa-syringe col-indigo',
      dosage: '1 Daily',
    },
  ];

  // TODO start
  tasks: Todo[] = [
    { title: 'Buy groceries', done: false, priority: 'Normal' },
    { title: 'Finish project report', done: false, priority: 'High' },
    { title: 'Clean the house', done: true, priority: 'Low' },
    { title: 'Call the bank', done: false, priority: 'Normal' },
    { title: 'Read a book', done: false, priority: 'Low' },
    { title: 'Schedule doctor appointment', done: false, priority: 'High' },
    { title: 'Prepare for presentation', done: false, priority: 'Normal' },
    { title: 'Exercise for 30 minutes', done: false, priority: 'Normal' },
    { title: 'Finish laundry', done: true, priority: 'Low' },
    { title: 'Write blog post', done: false, priority: 'High' },
    { title: 'Organize workspace', done: false, priority: 'Normal' },
    { title: 'Plan weekend trip', done: false, priority: 'High' },
    { title: 'Buy gifts for friends', done: false, priority: 'Low' },
  ];

  onTodoToggled(todo: Todo) {
    console.log('Todo toggled:', todo);
  }

  onTodosUpdated(updatedTodos: Todo[]) {
    console.log('Todos updated:', updatedTodos);
  }
  // TODO end

  // Events
  events = [
    {
      day: 'Tuesday',
      date: 4,
      month: 'Jan',
      title: 'Science Fair',
      timeStart: '11:00 AM',
      timeEnd: '12:30 PM',
      status: 'Today',
    },
    {
      day: 'Friday',
      date: 12,
      month: 'Jan',
      title: 'Guest Speaker',
      timeStart: '11:00 AM',
      timeEnd: '12:30 PM',
      status: 'In 8 days',
    },
    {
      day: 'Sunday',
      date: 18,
      month: 'Jan',
      title: 'Art Exhibition Opening',
      timeStart: '01:00 PM',
      timeEnd: '02:30 PM',
      status: 'In 11 days',
    },
  ];

  examList = [
    {
      title: 'Standard 1',
      dateRange: '23-03-2022 | 28-03-2022',
      statusClass: 'colorStyle1',
    },
    {
      title: 'Standard 2',
      dateRange: '10-03-2022 | 15-03-2022',
      statusClass: 'colorStyle2',
    },
    {
      title: 'Standard 3',
      dateRange: '03-04-2022 | 10-04-2022',
      statusClass: 'colorStyle3',
    },
    {
      title: 'Standard 4',
      dateRange: '11-05-2022 | 15-05-2022',
      statusClass: 'colorStyle4',
    },
    {
      title: 'Standard 5',
      dateRange: '17-05-2022 | 21-05-2022',
      statusClass: 'colorStyle1',
    },
    {
      title: 'Standard 6',
      dateRange: '23-05-2022 | 28-05-2022',
      statusClass: 'colorStyle2',
    },
    {
      title: 'Standard 7',
      dateRange: '11-06-2022 | 15-06-2022',
      statusClass: 'colorStyle3',
    },
  ];

  // Enhanced events with type and description for the new component
  enhancedEvents = [
    {
      day: 'Mon',
      date: '15',
      month: 'MAY',
      title: 'Final Exams - Mathematics',
      time: '09:00 - 11:00',
      status: 'Upcoming',
      type: 'exam',
      description: 'All students must bring calculators and stationary',
    },
    {
      day: 'Wed',
      date: '17',
      month: 'MAY',
      title: 'Final Exams - Science',
      time: '09:00 - 11:00',
      status: 'Upcoming',
      type: 'exam',
      description: 'Physics and Chemistry combined paper',
    },
    {
      day: 'Fri',
      date: '19',
      month: 'MAY',
      title: 'Final Exams - Languages',
      time: '09:00 - 11:00',
      status: 'Upcoming',
      type: 'exam',
    },
    {
      day: 'Mon',
      date: '22',
      month: 'MAY',
      title: 'Summer Vacation Begins',
      time: 'All Day',
      status: 'Upcoming',
      type: 'holiday',
      description: 'School closed until June 15th',
    },
    {
      day: 'Thu',
      date: '25',
      month: 'MAY',
      title: 'Parent-Teacher Conference',
      time: '14:00 - 17:00',
      status: 'Upcoming',
      type: 'meeting',
      description: 'Discuss student progress and summer assignments',
    },
    {
      day: 'Sat',
      date: '27',
      month: 'MAY',
      title: 'Annual Sports Day',
      time: '08:00 - 16:00',
      status: 'Upcoming',
      type: 'activity',
      description: 'All students should wear sports uniform',
    },
    {
      day: 'Mon',
      date: '05',
      month: 'JUN',
      title: 'Teacher Training Workshop',
      time: '09:00 - 15:00',
      status: 'Upcoming',
      type: 'meeting',
    },
    {
      day: 'Thu',
      date: '15',
      month: 'JUN',
      title: 'School Reopens',
      time: '08:00',
      status: 'Upcoming',
      type: 'activity',
      description: 'New academic year begins',
    },
    {
      day: 'Fri',
      date: '16',
      month: 'JUN',
      title: 'Orientation for New Students',
      time: '10:00 - 12:00',
      status: 'Upcoming',
      type: 'meeting',
    },
    {
      day: 'Mon',
      date: '19',
      month: 'JUN',
      title: 'Curriculum Planning Meeting',
      time: '13:00 - 15:00',
      status: 'Upcoming',
      type: 'meeting',
      description: 'For all department heads',
    },
  ];
}
