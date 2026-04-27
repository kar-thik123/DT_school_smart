import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ResourceModel {
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link';
}

export interface SubjectModel {
  id: number;
  name: string;
  code: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhotoUrl?: string;
  resources?: ResourceModel[];
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MySubjectsService {
  private staticSubjects: SubjectModel[] = [
    {
      id: 1,
      name: 'Mathematics',
      code: 'MATH101',
      teacherName: 'Dr. Alice Smith',
      teacherEmail: 'alice.smith@example.com',
      teacherPhotoUrl: 'assets/images/user/user1.jpg',
      resources: [
        {
          title: 'Algebra Basics PDF',
          url: 'https://example.com/algebra.pdf',
          type: 'pdf',
        },
        {
          title: 'Calculus Lecture Video',
          url: 'https://example.com/calculus.mp4',
          type: 'video',
        },
      ],
      description:
        'Fundamental concepts of mathematics including algebra and calculus.',
    },
    {
      id: 2,
      name: 'Physics',
      code: 'PHYS201',
      teacherName: 'Prof. Bob Johnson',
      teacherEmail: 'bob.johnson@example.com',
      teacherPhotoUrl: 'assets/images/user/user2.jpg',
      resources: [
        {
          title: 'Mechanics Notes',
          url: 'https://example.com/mechanics.pdf',
          type: 'pdf',
        },
        {
          title: 'Quantum Physics Intro',
          url: 'https://example.com/quantum.link',
          type: 'link',
        },
      ],
      description: 'Study of matter, energy, and their interactions.',
    },
    {
      id: 3,
      name: 'Chemistry',
      code: 'CHEM301',
      teacherName: 'Dr. Carol White',
      teacherEmail: 'carol.white@example.com',
      teacherPhotoUrl: 'assets/images/user/user3.jpg',
      resources: [
        {
          title: 'Organic Chemistry Book',
          url: 'https://example.com/organic.pdf',
          type: 'pdf',
        },
      ],
      description:
        'The study of the composition, structure, properties and change of matter.',
    },
    {
      id: 4,
      name: 'Biology',
      code: 'BIO401',
      teacherName: 'Dr. David Lee',
      teacherEmail: 'david.lee@example.com',
      teacherPhotoUrl: 'assets/images/user/user4.jpg',
      resources: [
        {
          title: 'Cell Biology Slides',
          url: 'https://example.com/cell-biology.pdf',
          type: 'pdf',
        },
        {
          title: 'DNA Replication Video',
          url: 'https://example.com/dna-replication.mp4',
          type: 'video',
        },
      ],
      description:
        'Explores living organisms, their structure, function, and evolution.',
    },
    {
      id: 5,
      name: 'English Literature',
      code: 'ENG501',
      teacherName: 'Ms. Emma Watson',
      teacherEmail: 'emma.watson@example.com',
      teacherPhotoUrl: 'assets/images/user/user5.jpg',
      resources: [
        {
          title: 'Shakespeare Plays Overview',
          url: 'https://example.com/shakespeare.pdf',
          type: 'pdf',
        },
        {
          title: 'Poetry Analysis Guide',
          url: 'https://example.com/poetry-guide.link',
          type: 'link',
        },
      ],
      description:
        'Study of classic and modern literary works in English with critical analysis.',
    },
    {
      id: 6,
      name: 'Computer Science',
      code: 'CS601',
      teacherName: 'Mr. Frank Miller',
      teacherEmail: 'frank.miller@example.com',
      teacherPhotoUrl: 'assets/images/user/user6.jpg',
      resources: [
        {
          title: 'Intro to Algorithms PDF',
          url: 'https://example.com/algorithms.pdf',
          type: 'pdf',
        },
        {
          title: 'JavaScript Tutorial Video',
          url: 'https://example.com/js-tutorial.mp4',
          type: 'video',
        },
      ],
      description:
        'Introduction to programming, algorithms, and computer systems.',
    },
  ];

  constructor() {}

  getSubjects(): Observable<SubjectModel[]> {
    return of(this.staticSubjects);
  }
}
