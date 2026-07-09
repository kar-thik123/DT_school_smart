import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentKPIs, SubjectPerformance, ContinueLearning } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-action-center',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './action-center.component.html',
  styleUrls: ['./action-center.component.scss']
})
export class ActionCenterComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  kpis: StudentKPIs | null = null;
  subjects: SubjectPerformance[] = [];
  continueLearning: ContinueLearning | null = null;
  showAllSubjects: boolean = false;

  get weakSubjectId(): string | undefined {
    if (!this.kpis?.weakSubject || !this.subjects) return undefined;
    return this.subjects.find(s => s.subjectName === this.kpis?.weakSubject)?.subjectId;
  }

  get weakSubjectNextNode(): { type: string, id: string } | undefined {
    if (!this.kpis?.weakSubject || !this.subjects) return undefined;
    return this.subjects.find(s => s.subjectName === this.kpis?.weakSubject)?.nextNode;
  }

  constructor(
    private dashboardService: StudentDashboardService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.state = 'loading';
    forkJoin({
      kpis: this.dashboardService.getKPIs().pipe(catchError(() => of(null))),
      subjects: this.dashboardService.getSubjectPerformance().pipe(catchError(() => of([]))),
      continueLearning: this.dashboardService.getContinueLearning().pipe(catchError(() => of(null)))
    }).subscribe({
      next: (data: any) => {
        this.kpis = data.kpis;
        this.subjects = (data.subjects || []).sort((a: SubjectPerformance, b: SubjectPerformance) => a.readiness - b.readiness);
        this.continueLearning = data.continueLearning;
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  toggleSubjects() {
    this.showAllSubjects = !this.showAllSubjects;
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
