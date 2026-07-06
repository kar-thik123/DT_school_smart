import { GlobalLoaderComponent } from '@shared/components/global-loader/global-loader.component';
import { Component, OnInit, inject } from '@angular/core';
import { MySubjectsService, SubjectModel } from './my-subjects.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-my-subjects',
  templateUrl: './my-subjects.component.html',
  styleUrl: './my-subjects.component.scss',
  standalone: true,
  imports: [GlobalLoaderComponent, 
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    BreadcrumbComponent
],
})
export class MySubjectsComponent implements OnInit {
  private mySubjectsService = inject(MySubjectsService);

  subjects: SubjectModel[] = [];
  filteredSubjects: SubjectModel[] = [];
  searchText: string = '';
  isLoading: boolean = true;
  hasError: boolean = false;

  breadscrums = [
    {
      title: 'My Subjects',
      items: ['Student'],
      active: 'My Subjects',
    },
  ];

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.hasError = false;
    this.mySubjectsService.getSubjects().subscribe({
      next: (data) => {
        this.subjects = data;
        this.filterSubjects();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching subjects', err);
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  filterSubjects(): void {
    if (!this.searchText) {
      this.filteredSubjects = this.subjects;
    } else {
      this.filteredSubjects = this.subjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
          subject.teacherName
            .toLowerCase()
            .includes(this.searchText.toLowerCase())
      );
    }
  }

  downloadResource(url: string): void {
    window.open(url, '_blank');
  }

  openSubjectDetails(subject: SubjectModel): void {
    // Implement detail view or modal here
    console.log('Open details for:', subject.name);
    alert('Details for ' + subject.name + ' would open here!');
  }
}
