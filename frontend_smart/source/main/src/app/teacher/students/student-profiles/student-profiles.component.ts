import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';


@Component({
  selector: 'app-student-profiles',
  templateUrl: './student-profiles.component.html',
  styleUrls: ['./student-profiles.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule
  ],

})
export class StudentProfilesComponent {
  breadscrums = [
    {
      title: 'Student Profile',
      items: ['Teacher', 'Students'],
      active: 'Profile',
    },
  ];

  studentProfile = {
    firstName: 'Sarah',
    lastName: 'Smith',
    rollNo: '101',
    gender: 'Female',
    dob: '2010-05-15',
    class: '10A',
    parentName: 'Robert Doe',
    mobile: '1234567890',
    email: 'sarah.smith@example.com',
    address: '456, Estern Avenue, Courtage Area, New York',
    img: 'assets/images/user/user4.jpg',
    department: 'Computer Department',
    location: 'New York, USA',
    following: '564',
    followers: '18k',
    posts: '565',
    bio: 'Hello I am Sarah Smith a student in Sanjivni College Surat. I love to study with all my class friends and professors.',
    stats: {
      lectures: '11k+',
      attendance: '92%',
      category: 'Science'
    },
    skills: [
      { name: 'Study', value: 45, color: 'l-bg-green' },
      { name: 'Cricket', value: 38, color: 'l-bg-orange' },
      { name: 'Music', value: 39, color: 'l-bg-cyan' },
      { name: 'Yoga', value: 70, color: 'l-bg-purple' }
    ],
    education: [
      { title: 'Schooling at Sarvoday Vidhyalay, Mumbai', icon: 'school' },
      { title: 'Bachelor In Arts in Bhagvati College Hariyana', icon: 'school' }
    ],
    certificates: [
      { title: '1st Prize in Music competition', icon: 'emoji_events' },
      { title: '1st Prize in Acting & Drama', icon: 'emoji_events' },
      { title: 'Gold Medal in Bachelor in Arts', icon: 'military_tech' }
    ]
  };

  constructor() {}
}
