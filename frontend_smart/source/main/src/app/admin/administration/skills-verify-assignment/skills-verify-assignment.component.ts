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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-skills-verify-assignment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatTooltipModule, BreadcrumbComponent, MatCheckboxModule
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
  filteredUsers: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  filteredSections: any[] = [];
  filteredRoles: any[] = [];

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
      role_id: ['', Validators.required],
      verifier_id: [[], Validators.required],
      skill_type: [[], Validators.required],
      grade_id: [[]],
      section_id: [[]]
    });
  }

  ngOnInit(): void {
    this.loadAssignments();
    this.loadUsers();
    this.loadRoles();
    this.loadGrades();
    this.loadSections();

    this.assignForm.get('role_id')?.valueChanges.subscribe((roleId: string) => {
      if (roleId) {
        this.filteredUsers = this.users.filter(u => u.role_id === roleId);
      } else {
        // If there is no active role explicitly selected (like when opening an edit dialog for a previous assignment), 
        // fall back to showing ONLY the assigned users so they are not dropped from the view, without listing ALL users.
        const currentSelectedIds = this.assignForm.get('verifier_id')?.value || [];
        this.filteredUsers = this.users.filter(u => currentSelectedIds.includes(u.id));
      }

      const currentVerifiers = this.assignForm.get('verifier_id')?.value || [];
      const validVerifiers = currentVerifiers.filter((vid: string) =>
        vid === 'selectAll' || this.filteredUsers.some(u => u.id === vid)
      );

      // We only want to patch and discard invalid assigned users if a role was specifically interacted with right now. 
      // If roleId is empty, avoid indiscriminant patching that wipes everything.
      if (roleId && currentVerifiers.length !== validVerifiers.length) {
        this.assignForm.patchValue({ verifier_id: validVerifiers }, { emitEvent: false });
      }
    });

    this.assignForm.get('grade_id')?.valueChanges.subscribe((gradeIds: string[] | null) => {
      if (gradeIds && gradeIds.length > 0) {
        // If 'null' (All Grades) is selected along with others, we might want to handle it, 
        // but typically gradeIds is just an array of selected values.
        this.filteredSections = this.sections.filter(s => gradeIds.includes(s.grade_id));
      } else {
        this.filteredSections = [];
      }
      this.assignForm.patchValue({ section_id: [] });
    });
  }

  getIds(items: any[], idField: string = 'id'): any[] {
    if (!items) return [];
    if (idField === 'self') return items;
    return items.map(item => item[idField]);
  }

  getGradeName(gradeId: string): string {
    const grade = this.grades.find(g => g.id === gradeId);
    return grade ? grade.name : 'Unknown Grade';
  }

  toggleAllNative(controlName: string, allValues: any[], isSelected: boolean) {
    if (isSelected) {
      this.assignForm.get(controlName)?.patchValue([...allValues, 'selectAll']);
    } else {
      this.assignForm.get(controlName)?.patchValue([]);
    }
  }

  toggleOneNative(controlName: string, allValues: any[]) {
    const selected = this.assignForm.get(controlName)?.value || [];
    const indexOfSelectAll = selected.indexOf('selectAll');

    if (indexOfSelectAll > -1 && selected.length - 1 < allValues.length) {
      // It was selected, but now one item was unselected
      const filtered = selected.filter((v: any) => v !== 'selectAll');
      this.assignForm.get(controlName)?.patchValue(filtered);
    } else if (indexOfSelectAll === -1 && selected.length === allValues.length) {
      // All items are selected, add selectAll back to display the checked state
      this.assignForm.get(controlName)?.patchValue([...allValues, 'selectAll']);
    }
  }

  loadAssignments() {
    this.http.get<any[]>(`${environment.apiUrl}/skill-assignment`).subscribe({
      next: (data) => this.assignments = data,
      error: (err) => this.showError('Failed to load assignments')
    });
  }

  loadUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => {
        this.users = data;
        const roleId = this.assignForm.get('role_id')?.value;
        if (roleId) {
          this.filteredUsers = this.users.filter(u => u.role_id === roleId);
        } else {
          const currentSelectedIds = this.assignForm.get('verifier_id')?.value || [];
          this.filteredUsers = this.users.filter(u => currentSelectedIds.includes(u.id));
        }
      },
      error: (err) => console.error(err)
    });
  }

  loadRoles() {
    this.http.get<any[]>(`${environment.apiUrl}/roles`).subscribe({
      next: (data) => {
        // filter roles that have any SKILLS_VERIFY_ASSIGNMENT permission
        this.filteredRoles = data.filter(role =>
          role.permissions?.some((rp: any) =>
            rp.permission.module === 'SKILLS_VERIFY_ASSIGNMENT' &&
            ['ASSIGN', 'DELETE', 'VIEW'].includes(rp.permission.action)
          )
        );
      },
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

    const val = { ...this.assignForm.value };
    val.verifier_ids = (val.verifier_id || []).filter((v: any) => v !== 'selectAll');
    val.skill_types = (val.skill_type || []).filter((v: any) => v !== 'selectAll');
    val.grade_ids = (val.grade_id || []).filter((v: any) => v !== 'selectAll');
    val.section_ids = (val.section_id || []).filter((v: any) => v !== 'selectAll');

    delete val.verifier_id;
    delete val.skill_type;
    delete val.grade_id;
    delete val.section_id;

    if (this.editingId) {
      this.http.put(`${environment.apiUrl}/skill-assignment/${this.editingId}`, val).subscribe({
        next: () => {
          this.snackBar.open('Assignment updated successfully', 'Close', { duration: 3000 });
          this.loadAssignments();
          this.cancelEdit();
        },
        error: (err) => this.showError(err.error?.error || 'Failed to update assignment')
      });
    } else {
      this.http.post(`${environment.apiUrl}/skill-assignment`, val).subscribe({
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
      role_id: assignment.role_id || '',
      verifier_id: assignment.verifier_ids || [],
      skill_type: assignment.skill_types || [],
      grade_id: assignment.grade_ids || [],
      section_id: assignment.section_ids || []
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
