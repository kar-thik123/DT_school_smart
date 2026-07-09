import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentDashboardContextService } from '../../student-dashboard-context.service';
import { SubjectPerformance } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-my-favorites',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './my-favorites.component.html',
  styleUrls: ['./my-favorites.component.scss']
})
export class MyFavoritesComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  favoriteSubjects: SubjectPerformance[] = [];
  favoriteColour: string | null = null;
  showAllFavoriteSubjects = false;

  constructor(
    private dashboardService: StudentDashboardService,
    private contextService: StudentDashboardContextService,
    private router: Router
  ) {}

  ngOnInit() {
    this.contextService.overview$.subscribe(overview => {
      this.favoriteColour = overview?.favorite_colour || null;
      this.loadData(overview.favorite_subjects || []);
    });
  }

  loadData(favSubjectNames: string[]) {
    this.state = 'loading';
    this.dashboardService.getSubjectPerformance().subscribe({
      next: (subjects) => {
        if (subjects && favSubjectNames.length > 0) {
          this.favoriteSubjects = subjects.filter(s => favSubjectNames.includes(s.subjectName));
        } else {
          this.favoriteSubjects = [];
        }
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  toggleFavoriteSubjects() {
    this.showAllFavoriteSubjects = !this.showAllFavoriteSubjects;
  }

  navigateToPractice(subjectId?: string, subjectName?: string, nextNode?: any) {
    if (subjectId) {
      const queryParams: any = { subject_id: subjectId, subject_name: subjectName };
      this.router.navigate(['/student/academics/mcq'], { queryParams });
    } else {
      this.router.navigate(['/student/academics/mcq']);
    }
  }
}
