import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDashboardService } from '../../dashboard.service';
import { StudentDashboardContextService } from '../../student-dashboard-context.service';
import { StudentSkill } from '../../dashboard.model';
import { WidgetSkeletonComponent } from '@shared/components/dashboard-widgets/widget-skeleton/widget-skeleton.component';

@Component({
  selector: 'app-skills-overview',
  standalone: true,
  imports: [CommonModule, WidgetSkeletonComponent],
  templateUrl: './skills-overview.component.html',
  styleUrls: ['./skills-overview.component.scss']
})
export class SkillsOverviewComponent implements OnInit {
  state: 'loading' | 'loaded' | 'error' = 'loading';
  
  skills: StudentSkill[] = [];
  showAllSkills = false;

  constructor(
    private dashboardService: StudentDashboardService,
    private contextService: StudentDashboardContextService
  ) {}

  ngOnInit() {
    this.contextService.overview$.subscribe(overview => {
      this.loadData(overview.academic_year_id!);
    });
  }

  loadData(academicYearId: string) {
    this.state = 'loading';
    this.dashboardService.getSkills(academicYearId).subscribe({
      next: (data) => {
        this.skills = data || [];
        this.state = 'loaded';
      },
      error: () => {
        this.state = 'error';
      }
    });
  }

  toggleSkills() {
    this.showAllSkills = !this.showAllSkills;
  }

  getSkillIcon(skillType: string): { icon: string, bg: string, color: string } {
    switch (skillType.toLowerCase()) {
      case 'sports': return { icon: 'fas fa-running', bg: '#dcfce7', color: '#16a34a' }; // bg-light-success, text-success
      case 'arts': return { icon: 'fas fa-palette', bg: '#f3e8ff', color: '#9333ea' }; // bg-light-purple, text-purple
      case 'music': return { icon: 'fas fa-music', bg: '#e0f2fe', color: '#0284c7' }; // bg-light-info, text-info
      case 'technology': return { icon: 'fas fa-laptop-code', bg: '#fef3c7', color: '#d97706' }; // bg-light-warning, text-warning
      case 'leadership': return { icon: 'fas fa-users', bg: '#fee2e2', color: '#dc2626' }; // bg-light-danger, text-danger
      default: return { icon: 'fas fa-star', bg: '#f1f5f9', color: '#64748b' }; // default
    }
  }
}
