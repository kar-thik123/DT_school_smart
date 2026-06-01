import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { environment } from 'environments/environment';
import Swal from 'sweetalert2';
import { AuthService, AcademicContextService } from '@core';
import { AcademicContextSelectorComponent } from '@shared/components/academic-context-selector/academic-context-selector.component';
import { Router } from '@angular/router';

import { forkJoin } from 'rxjs';
import { AcademicStructureService, IGrade, ISection } from '../academic-structure/services/academic-structure.service';

@Component({
  selector: 'app-completion-mgmt',
  templateUrl: './completion-mgmt.component.html',
  styleUrls: ['./completion-mgmt.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    BreadcrumbComponent,
    AcademicContextSelectorComponent
  ]
})
export class CompletionMgmtComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private academicService = inject(AcademicStructureService);
  private academicContextService = inject(AcademicContextService);
  private router = inject(Router);

  breadscrums = [{ title: 'Completion Tracking', items: ['Administration'], active: 'Completion Tracking' }];
  
  academicYearId: string = '';
  
  grades: IGrade[] = [];
  allSections: ISection[] = [];
  
  selectedGradeId: string | null = null;
  selectedGradeName: string = '';
  selectedSectionId: string | null = null;
  selectedSectionName: string = '';
  selectedSubjectId: string | null = null;
  selectedSubjectName: string = '';
  
  units: any[] = [];
  trackings: any[] = [];
  
  isLoading = false;
  isInitialLoading = true;
  
  settings: any = { enable_module: true, enable_notifications: true };
  canManageCompletion = false;
  
  ngOnInit() {
    const isTeacherPath = this.router.url.startsWith('/teacher/');
    const parentPath = isTeacherPath ? 'Teacher' : 'Administration';
    this.breadscrums = [{ title: 'Completion Tracking', items: [parentPath], active: 'Completion Tracking' }];

    this.canManageCompletion = this.authService.hasPermission('COMPLETION_TRACKING', 'MANAGE') ||
                               this.authService.hasPermission('COMPLETION_TRACKING_MANAGE');

    // Subscribe to centralized Academic Context
    this.academicContextService.activeYear$.subscribe((year: any) => {
      this.academicYearId = year?.id || '';
      if (this.academicYearId) {
        this.loadSettings();
      } else {
        this.settings = { enable_module: true, enable_notifications: true };
        this.loadContextData();
      }
    });
  }
  
  loadSettings() {
    this.http.get<any>(`${environment.apiUrl}/settings/completion`).subscribe({
      next: (res) => {
        if (res && res.config_data) {
          this.settings = {
            enable_module: res.config_data.enable_module !== false,
            enable_notifications: res.config_data.enable_notifications !== false
          };
        }
        if (this.settings.enable_module !== false) {
          this.loadContextData();
        } else {
          this.isInitialLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading settings, using defaults:', err);
        this.settings = { enable_module: true, enable_notifications: true };
        this.loadContextData();
      }
    });
  }

  loadContextData() {
    this.isInitialLoading = true;
    forkJoin({
      grades: this.academicService.getGrades(),
      sections: this.academicService.getSections()
    }).subscribe({
      next: (res) => {
        this.grades = res.grades || [];
        this.allSections = res.sections || [];
        this.isInitialLoading = false;
      },
      error: () => {
        this.isInitialLoading = false;
      }
    });
  }
  
  selectContext(event: any) {
    if (!event.grade) return;
    
    this.selectedGradeId = event.grade.id;
    this.selectedGradeName = event.grade.name;
    
    if (event.section) {
      this.selectedSectionId = event.section === 'ALL' ? 'ALL' : event.section.id;
      this.selectedSectionName = event.section === 'ALL' ? 'All Sections' : event.section.name;
    } else {
      this.selectedSectionId = null;
      this.selectedSectionName = '';
    }
    
    if (event.subject) {
      this.selectedSubjectId = event.subject.id || event.subject.subject_id;
      this.selectedSubjectName = event.subject.name;
    } else {
      this.selectedSubjectId = null;
      this.selectedSubjectName = '';
    }
    
    // Only load if all three are selected (matching Question Bank behavior)
    if (this.selectedGradeId && this.selectedSectionId && this.selectedSubjectId) {
       this.loadTopics();
    } else {
       this.units = [];
    }
  }
  
  loadTopics() {
    if (!this.selectedGradeId || !this.selectedSubjectId) return;
    
    this.isLoading = true;
    const secParam = (this.selectedSectionId && this.selectedSectionId !== 'ALL') ? `&section_id=${this.selectedSectionId}` : '';
    const url = `${environment.apiUrl}/completion/topics?grade_id=${this.selectedGradeId}&subject_id=${this.selectedSubjectId}${secParam}`;
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.units = res.units || [];
        this.trackings = res.trackings || [];
        this.mapTrackingsToUnits();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.units = [];
      }
    });
  }
  
  mapTrackingsToUnits() {
    // Map is_completed states to units/topics/subtopics
    this.units.forEach(u => {
      const tUnit = this.trackings.find(t => t.completion_level === 'UNIT' && t.unit_id === u.id);
      u.is_completed = tUnit ? tUnit.is_completed : false;
      
      u.topics?.forEach((t: any) => {
        const tTopic = this.trackings.find(tr => tr.completion_level === 'TOPIC' && tr.topic_id === t.id);
        t.is_completed = tTopic ? tTopic.is_completed : false;
        
        t.sub_topics?.forEach((st: any) => {
          const tSub = this.trackings.find(tr => tr.completion_level === 'SUBTOPIC' && tr.sub_topic_id === st.id);
          st.is_completed = tSub ? tSub.is_completed : false;
        });
      });
    });
  }
  
  async onToggleChange(event: any, item: any, level: 'UNIT' | 'TOPIC' | 'SUBTOPIC', parentItem?: any) {
    const isChecked = event.checked;
    // Revert visually immediately; we will apply it if confirmed
    item.is_completed = !isChecked;
    event.source.checked = !isChecked;
    
    let cascadeTopics: string[] = [];
    let cascadeSubtopics: string[] = [];
    
    if (isChecked) {
      if (level === 'UNIT' && item.topics?.length > 0) {
        let text = `This will mark all topics and subtopics under this unit as completed.<br><br>`;
        text += this.settings.enable_notifications ? 
          `<label style="display: flex; align-items: center; justify-content: center; gap: 8px;">
             <input type="checkbox" id="sendNotification" checked style="width:16px;height:16px;"> Send notification
           </label>` : '';
           
        const result = await Swal.fire({
          title: 'Complete Unit?',
          html: text,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Complete',
          preConfirm: () => {
             const chk = document.getElementById('sendNotification') as HTMLInputElement;
             return { sendNotification: chk ? chk.checked : false };
          }
        });
        
        if (!result.isConfirmed) return;
        
        item.topics.forEach((t: any) => {
          cascadeTopics.push(t.id);
          t.sub_topics?.forEach((st: any) => cascadeSubtopics.push(st.id));
        });
        
        this.executeToggle(item, level, true, result.value?.sendNotification, cascadeTopics, cascadeSubtopics);
      } 
      else if (level === 'TOPIC' && item.sub_topics?.length > 0) {
        let text = `This will mark all subtopics under this topic as completed.<br><br>`;
        text += this.settings.enable_notifications ? 
          `<label style="display: flex; align-items: center; justify-content: center; gap: 8px;">
             <input type="checkbox" id="sendNotification" checked style="width:16px;height:16px;"> Send notification
           </label>` : '';
           
        const result = await Swal.fire({
          title: 'Complete Topic?',
          html: text,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Complete',
          preConfirm: () => {
             const chk = document.getElementById('sendNotification') as HTMLInputElement;
             return { sendNotification: chk ? chk.checked : false };
          }
        });
        
        if (!result.isConfirmed) return;
        
        item.sub_topics.forEach((st: any) => cascadeSubtopics.push(st.id));
        this.executeToggle(item, level, true, result.value?.sendNotification, [], cascadeSubtopics);
      }
      else {
        // Direct toggle for Subtopic or empty Topic/Unit
        this.executeToggle(item, level, true, false, [], []);
      }
    } else {
       // Toggle OFF -> auto turn off children silently
       if (level === 'UNIT') {
         item.topics?.forEach((t: any) => {
           cascadeTopics.push(t.id);
           t.sub_topics?.forEach((st: any) => cascadeSubtopics.push(st.id));
         });
       } else if (level === 'TOPIC') {
         item.sub_topics?.forEach((st: any) => cascadeSubtopics.push(st.id));
       }
       this.executeToggle(item, level, false, false, cascadeTopics, cascadeSubtopics);
    }
  }
  
  private executeToggle(item: any, level: 'UNIT' | 'TOPIC' | 'SUBTOPIC', isCompleted: boolean, sendNotif: boolean, cascadeTopics: string[], cascadeSubtopics: string[]) {
    
    // Optimistic UI update
    item.is_completed = isCompleted;
    if (level === 'UNIT' && isCompleted) {
       item.topics?.forEach((t: any) => {
         t.is_completed = true;
         t.sub_topics?.forEach((st: any) => st.is_completed = true);
       });
    } else if (level === 'TOPIC' && isCompleted) {
       item.sub_topics?.forEach((st: any) => st.is_completed = true);
    } else if (!isCompleted) {
       if (level === 'UNIT') {
         item.topics?.forEach((t: any) => {
           t.is_completed = false;
           t.sub_topics?.forEach((st: any) => st.is_completed = false);
         });
       } else if (level === 'TOPIC') {
         item.sub_topics?.forEach((st: any) => st.is_completed = false);
       }
    }

    const payload = {
      grade_id: this.selectedGradeId,
      section_id: (this.selectedSectionId && this.selectedSectionId !== 'ALL') ? this.selectedSectionId : null,
      subject_id: this.selectedSubjectId,
      level,
      id: item.id,
      is_completed: isCompleted,
      send_notification: sendNotif,
      cascade_topic_ids: cascadeTopics,
      cascade_subtopic_ids: cascadeSubtopics
    };

    this.http.post(`${environment.apiUrl}/completion/toggle`, payload).subscribe({
      next: () => {},
      error: () => {
         // Revert on error
         Swal.fire('Error', 'Failed to update completion status', 'error');
         this.loadTopics(); // reload state
      }
    });
  }
}
