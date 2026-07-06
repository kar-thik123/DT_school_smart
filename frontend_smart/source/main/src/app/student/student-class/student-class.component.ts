import { GlobalLoaderComponent } from '@shared/components/global-loader/global-loader.component';
import { Component, OnInit, inject } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { StudentClassService } from './student-class.service';
import { ClassModel } from './student-class.model';
import { MatTableModule } from '@angular/material/table';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-student-class',
  standalone: true,
  imports: [GlobalLoaderComponent, 
    MatCardModule,
    BreadcrumbComponent,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatTableModule,
    MatToolbarModule,
    MatButtonModule
],
  templateUrl: './student-class.component.html',
  styleUrl: './student-class.component.scss',
})
export class StudentClassComponent implements OnInit {
  private studentClassService = inject(StudentClassService);

  classes: ClassModel[] = [];
  filteredClasses: ClassModel[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  searchTerm: string = '';

  breadscrums = [
    {
      title: 'My Class',
      items: ['Student'],
      active: 'My Class',
    },
  ];

  displayedColumns: string[] = [
    'className',
    'subjects',
    'teachers',
    'schedule',
  ];

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.isLoading = true;
    this.error = null;
    this.studentClassService.getEnrolledClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load classes. Please try again later.';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredClasses = [...this.classes];
      return;
    }
    this.filteredClasses = this.classes.filter(
      (classItem) =>
        classItem.subjects.some((subject) =>
          subject.toLowerCase().includes(this.searchTerm.toLowerCase())
        ) ||
        classItem.teachers.some((teacher) =>
          teacher.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
    );
  }
}
