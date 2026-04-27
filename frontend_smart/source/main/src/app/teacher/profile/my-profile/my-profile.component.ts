import { Component, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatButtonModule,
    MatTabsModule,
    DatePipe,
  ],
})
export class MyProfileComponent {
  private fb = inject(UntypedFormBuilder);
  profileForm: UntypedFormGroup;

  breadscrums = [
    {
      title: 'My Profile',
      items: ['Teacher', 'Profile'],
      active: 'My Profile',
    },
  ];

  teacherProfile = {
    firstName: 'John',
    lastName: 'Doe',
    role: 'Senior Teacher',
    department: 'Mathematics',
    gender: 'Male',
    dob: '1985-05-15',
    mobile: '1234567890',
    email: 'john.teacher@example.com',
    address: '456 Teacher Lane, City',
    location: 'Mumbai, India',
    img: 'assets/images/user/user1.jpg',
    coverImg: 'assets/images/image-gallery/6.jpg',
    bio: 'Passionate Mathematics teacher with over 10 years of experience in simplifying complex concepts for students. Dedicated to fostering a positive learning environment and encouraging student success.',
    experience_years: 10,
    subject_specialization: 'Mathematics',
    salary: '50000',
    stats: {
      followers: '1.2k',
      following: '450',
      posts: '128',
      clients: '450',
      reviews: '89',
      revenue: '$450',
      students: '120',
    },
    skills: [
      { name: 'Mathematics', value: 95, color: 'l-bg-purple' },
      { name: 'Teaching', value: 90, color: 'l-bg-green' },
      { name: 'Classroom Mgmt', value: 85, color: 'l-bg-orange' },
      { name: 'Counseling', value: 80, color: 'l-bg-cyan' },
    ],
    education: [
      {
        title: 'PhD in Mathematics from University of Delhi',
        year: '2010 - 2014',
        icon: 'school',
      },
      {
        title: 'Master of Science in Mathematics',
        year: '2008 - 2010',
        icon: 'school',
      },
    ],
    experience: [
      {
        title: 'Senior Teacher at Smart School',
        year: '2018 - Present',
        icon: 'work',
      },
      {
        title: 'Mathematics Teacher at City High School',
        year: '2014 - 2018',
        icon: 'work',
      },
    ],
  };

  constructor() {
    this.profileForm = this.fb.group({
      firstName: [this.teacherProfile.firstName, [Validators.required]],
      lastName: [this.teacherProfile.lastName, [Validators.required]],
      department: [this.teacherProfile.department, [Validators.required]],
      gender: [this.teacherProfile.gender.toLowerCase(), [Validators.required]],
      dob: [this.teacherProfile.dob, [Validators.required]],
      mobile: [this.teacherProfile.mobile, [Validators.required]],
      email: [
        this.teacherProfile.email,
        [Validators.required, Validators.email],
      ],
      address: [this.teacherProfile.address],
    });
  }

  onSubmit() {
    console.log('Profile updated:', this.profileForm.value);
  }

  getSkillColor(colorClass: string): string {
    const colorMap: { [key: string]: string } = {
      'l-bg-purple': '#ab8ce4',
      'l-bg-green': '#2ed8b6',
      'l-bg-orange': '#FFB64D',
      'l-bg-cyan': '#01dbdf',
    };
    return colorMap[colorClass] || '#ab8ce4';
  }
}
