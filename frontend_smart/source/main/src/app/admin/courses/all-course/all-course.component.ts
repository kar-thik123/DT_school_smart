import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CourseCardComponent } from '@shared/components/course-card/course-card.component';


@Component({
  selector: 'app-all-course',
  templateUrl: './all-course.component.html',
  styleUrls: ['./all-course.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    CourseCardComponent
],
})
export class AllCourseComponent {
  breadscrums = [
    {
      title: 'All Course',
      items: ['Course'],
      active: 'All Course',
    },
  ];
  constructor() {
    // constructor
  }

  courses = [
    {
      title: 'PHP Development Course',
      description: `In this course, you'll explore the basic structure of a web application and how a web browser interacts with a web server.`,
      duration: '25 mins',
      rating: 4.5,
      category: 'Development',
      image: 'assets/images/banner/course1.png',
      instructor: {
        name: 'John Deo',
        avatar: 'assets/images/user/user1.jpg',
      },
      likes: 368,
      comments: 48,
    },
    {
      title: 'Java Development Course',
      description: `Learn Java programming fundamentals and build robust applications with industry-standard practices.`,
      duration: '45 mins',
      rating: 4.8,
      category: 'Programming',
      image: 'assets/images/banner/course2.png',
      instructor: {
        name: 'Sarah Smith',
        avatar: 'assets/images/user/user2.jpg',
      },
      likes: 2951,
      comments: 254,
    },
    {
      title: 'Angular Development Course',
      description: `Master Angular framework and build dynamic, responsive web applications with modern best practices.`,
      duration: '25 mins',
      rating: 4.9,
      category: 'Frontend',
      image: 'assets/images/banner/course3.png',
      instructor: {
        name: 'Airi Satou',
        avatar: 'assets/images/user/user3.jpg',
      },
      likes: 7871,
      comments: 658,
    },
    {
      title: 'SEO Optimization Course',
      description: `Learn effective SEO strategies to improve website visibility and drive organic traffic to your business.`,
      duration: '30 mins',
      rating: 4.7,
      category: 'Marketing',
      image: 'assets/images/banner/course4.png',
      instructor: {
        name: 'Ashton Cox',
        avatar: 'assets/images/user/user4.jpg',
      },
      likes: 1258,
      comments: 158,
    },
    {
      title: 'Python for Data Science',
      description: `Dive into data analysis, visualization, and machine learning using Python and its powerful libraries.`,
      duration: '60 mins',
      rating: 4.6,
      category: 'Data Science',
      image: 'assets/images/banner/course2.png',
      instructor: {
        name: 'Emily Johnson',
        avatar: 'assets/images/user/user5.jpg',
      },
      likes: 3412,
      comments: 312,
    },
    {
      title: 'React JS Complete Guide',
      description: `Learn React from scratch, understand component lifecycle, and build high-performance SPAs.`,
      duration: '40 mins',
      rating: 4.7,
      category: 'Frontend',
      image: 'assets/images/banner/course1.png',
      instructor: {
        name: 'Michael Lee',
        avatar: 'assets/images/user/user6.jpg',
      },
      likes: 2210,
      comments: 178,
    },
    {
      title: 'UX/UI Design Fundamentals',
      description: `Understand user-centered design, wireframing, and UI tools to build intuitive interfaces.`,
      duration: '50 mins',
      rating: 4.4,
      category: 'Design',
      image: 'assets/images/banner/course4.png',
      instructor: {
        name: 'Laura Kim',
        avatar: 'assets/images/user/user7.jpg',
      },
      likes: 1298,
      comments: 143,
    },
    {
      title: 'DevOps with Docker & Kubernetes',
      description: `Master containerization and orchestration with practical hands-on projects in Docker and Kubernetes.`,
      duration: '75 mins',
      rating: 4.9,
      category: 'DevOps',
      image: 'assets/images/banner/course3.png',
      instructor: {
        name: 'Robert Brown',
        avatar: 'assets/images/user/user8.jpg',
      },
      likes: 4120,
      comments: 367,
    },
    {
      title: 'Mobile App Development with Flutter',
      description: `Build beautiful native apps for iOS and Android using Dart and Flutter's rich widget set.`,
      duration: '55 mins',
      rating: 4.6,
      category: 'Mobile Development',
      image: 'assets/images/banner/course4.png',
      instructor: {
        name: 'Sophia Wilson',
        avatar: 'assets/images/user/user9.jpg',
      },
      likes: 2764,
      comments: 198,
    },
    {
      title: 'Machine Learning Basics',
      description: `Explore core ML concepts, supervised and unsupervised learning, and implement basic algorithms.`,
      duration: '65 mins',
      rating: 4.8,
      category: 'AI/ML',
      image: 'assets/images/banner/course3.png',
      instructor: {
        name: 'Daniel Clark',
        avatar: 'assets/images/user/user10.jpg',
      },
      likes: 3845,
      comments: 289,
    },
    {
      title: 'Cybersecurity Essentials',
      description: `Understand threats, vulnerabilities, encryption, and best practices for securing systems.`,
      duration: '45 mins',
      rating: 4.5,
      category: 'Security',
      image: 'assets/images/banner/course2.png',
      instructor: {
        name: 'Nina Patel',
        avatar: 'assets/images/user/user11.jpg',
      },
      likes: 1932,
      comments: 165,
    },
    {
      title: 'Digital Marketing Strategy',
      description: `Build end-to-end marketing campaigns using SEO, PPC, social media, and analytics tools.`,
      duration: '35 mins',
      rating: 4.6,
      category: 'Marketing',
      image: 'assets/images/banner/course1.png',
      instructor: {
        name: 'Liam Martinez',
        avatar: 'assets/images/user/user1.jpg',
      },
      likes: 2547,
      comments: 202,
    },
  ];
}
