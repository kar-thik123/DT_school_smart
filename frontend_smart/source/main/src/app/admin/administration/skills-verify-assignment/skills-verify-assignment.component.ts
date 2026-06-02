import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-skills-verify-assignment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, 
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatTooltipModule, BreadcrumbComponent
  ],
  templateUrl: './skills-verify-assignment.component.html',
  styleUrls: ['./skills-verify-assignment.component.scss']
})
export class SkillsVerifyAssignmentComponent implements OnInit {
  breadscrums = [
    {
      title: 'Verification Assignments',
      items: ['Administration'],
      active: 'Assignments'
    }
  ];

  assignments: any[] = [];
  users: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  filteredSections: any[] = [];
  
  skillTypes = ['Academic Skills', 'Extra Curricular Skills'];
  
  assignForm: FormGroup;
  displayedColumns = ['verifier', 'skill_type', 'grade', 'section', 'actions'];
  editingId: string | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.assignForm = this.fb.group({
      verifier_id: ['', Validators.required],
      skill_type: ['', Validators.required],
      grade_id: [null],
      section_id: [null]
    });
  }

  ngOnInit(): void {
    this.loadAssignments();
    this.loadUsers();
    this.loadGrades();
    this.loadSections();

    this.assignForm.get('grade_id')?.valueChanges.subscribe(gradeId => {
      if (gradeId) {
        this.filteredSections = this.sections.filter(s => s.grade_id === gradeId);
      } else {
        this.filteredSections = [];
      }
      this.assignForm.patchValue({ section_id: null });
    });
  }

  loadAssignments() {
    this.http.get<any[]>(`${environment.apiUrl}/skill-assignment`).subscribe({
      next: (data) => this.assignments = data,
      error: (err) => this.showError('Failed to load assignments')
    });
  }

  loadUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error(err)
    });
  }

  loadGrades() {
    this.http.get<any[]>(`${environment.apiUrl}/academic/grades`).subscribe({
      next: (data) => this.grades = data,
      error: (err) => console.error(err)
    });
  }

  loadSections() {
    this.http.get<any[]>(`${environment.apiUrl}/academic/sections`).subscribe({
      next: (data) => this.sections = data,
      error: (err) => console.error(err)
    });
  }

  onSubmit() {
    if (this.assignForm.invalid) return;
    
    if (this.editingId) {
      this.http.put(`${environment.apiUrl}/skill-assignment/${this.editingId}`, this.assignForm.value).subscribe({
        next: () => {
          this.snackBar.open('Assignment updated successfully', 'Close', { duration: 3000 });
          this.loadAssignments();
          this.cancelEdit();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to update assignment')
      });
    } else {
      this.http.post(`${environment.apiUrl}/skill-assignment`, this.assignForm.value).subscribe({
        next: () => {
          this.snackBar.open('Assignment created successfully', 'Close', { duration: 3000 });
          this.loadAssignments();
          this.assignForm.reset();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to create assignment')
      });
    }
  }

  editAssignment(assignment: any) {
    this.editingId = assignment.id;
    this.assignForm.patchValue({
      verifier_id: assignment.verifier_id,
      skill_type: assignment.skill_type,
      grade_id: assignment.grade_id,
      section_id: assignment.section_id
    });
    // Scroll to top or just let them see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId = null;
    this.assignForm.reset();
  }

  deleteAssignment(id: string) {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    
    this.http.delete(`${environment.apiUrl}/skill-assignment/${id}`).subscribe({
      next: () => {
        this.snackBar.open('Assignment deleted', 'Close', { duration: 3000 });
        this.loadAssignments();
      },
      error: (err) => this.showError('Failed to delete assignment')
    });
  }

  showError(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'error-snackbar' });
  }
}
