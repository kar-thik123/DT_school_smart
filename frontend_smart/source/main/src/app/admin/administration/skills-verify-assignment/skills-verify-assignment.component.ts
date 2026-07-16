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
import { MatMenuModule } from '@angular/material/menu';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { GlobalLoaderComponent } from '@shared/components/global-loader/global-loader.component';
import { AcademicContextService } from '@core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-skills-verify-assignment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule,
    MatTooltipModule, BreadcrumbComponent, MatCheckboxModule,
    MatMenuModule, GlobalLoaderComponent
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
  isLoadingAssignments: boolean = false;
  isPatching: boolean = false;
  users: any[] = [];
  filteredUsers: any[] = [];
  grades: any[] = [];
  sections: any[] = [];
  filteredSections: any[] = [];
  filteredRoles: any[] = [];

  skillTypes = ['Academic Skills', 'Extra Curricular Skills'];

  assignForm: FormGroup;
  displayedColumns: string[] = ['verifier', 'skill_type', 'grade', 'section', 'actions'];

  editingId: string | null = null;
  academicYearId: string = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private academicContextService: AcademicContextService
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
    // Attempt to get from service first
    const currentYear = this.academicContextService.currentActiveYear;
    if (currentYear && currentYear.id) {
      this.academicYearId = currentYear.id;
      this.loadAssignments();
    } else {
      // Fallback: direct HTTP call if service hasn't initialized properly
      this.http.get<any>(`${environment.apiUrl}/academic/active-year`).subscribe({
        next: (year) => {
          this.academicYearId = year?.id || '';
          if (this.academicYearId) {
            this.loadAssignments();
          }
        },
        error: (err) => {
          console.error('Failed to load active year in component:', err);
          this.showError('Warning: No active academic year found. Cannot load assignments.');
        }
      });
    }

    this.academicContextService.activeYear$.subscribe((year: any) => {
      // If we already loaded it, don't overwrite if it's empty
      if (year && year.id) {
        this.academicYearId = year.id;
        this.loadAssignments();
      }
    });

    this.loadRoles();
    this.loadUsers();
    this.loadGrades();
    this.loadSections();

    this.assignForm.get('role_id')?.valueChanges.subscribe((roleId: string) => {
      if (roleId) {
        this.filteredUsers = this.users.filter(u => u.role_id === roleId);
      } else {
        this.filteredUsers = [];
      }

      if (!this.isPatching) {
        this.assignForm.patchValue({ verifier_id: [] }, { emitEvent: false });
      }
    });

    this.assignForm.get('grade_id')?.valueChanges.subscribe((gradeIds: string[] | null) => {
      if (gradeIds && gradeIds.length > 0) {
        this.filteredSections = this.sections.filter(s => gradeIds.includes(s.grade_id));
      } else {
        this.filteredSections = [...this.sections];
      }
      
      if (!this.isPatching) {
        this.assignForm.patchValue({ section_id: [] }, { emitEvent: false });
      }
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

  isAllSelected(controlName: string, allValues: any[]): boolean {
    const selected = this.assignForm.get(controlName)?.value || [];
    return allValues.length > 0 && selected.length === allValues.length;
  }

  isIndeterminate(controlName: string, allValues: any[]): boolean {
    const selected = this.assignForm.get(controlName)?.value || [];
    return selected.length > 0 && selected.length < allValues.length;
  }

  toggleAllNative(controlName: string, allValues: any[], isSelected: boolean) {
    if (isSelected) {
      this.assignForm.get(controlName)?.patchValue([...allValues]);
    } else {
      this.assignForm.get(controlName)?.patchValue([]);
    }
  }

  loadAssignments() {
    if (!this.academicYearId) return;
    
    this.isLoadingAssignments = true;
    this.http.get<any[]>(`${environment.apiUrl}/skill-assignment?academic_year_id=${this.academicYearId}`).subscribe({
      next: (data) => {
        this.assignments = data;
        this.isLoadingAssignments = false;
      },
      error: (err) => {
        this.showError('Failed to load assignments');
        this.isLoadingAssignments = false;
      }
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
        // Previously filtered roles by SKILLS_VERIFY_ASSIGNMENT which excluded many valid verifier roles.
        // We now allow selecting from all available roles.
        this.filteredRoles = data;
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
      next: (data) => {
        this.sections = data;
        if (!this.assignForm.get('grade_id')?.value?.length) {
          this.filteredSections = [...data];
        }
      },
      error: (err) => console.error(err)
    });
  }

  onSubmit() {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    if (!this.academicYearId) {
      this.showError('Active Academic Year is not set. Please ensure an active academic year is configured.');
      return;
    }

    const val = { ...this.assignForm.value, academic_year_id: this.academicYearId };
    val.verifier_ids = val.verifier_id || [];
    val.skill_types = val.skill_type || [];
    val.grade_ids = val.grade_id || [];
    val.section_ids = val.section_id || [];

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
        error: (err) => {
          const errMsg = typeof err.error?.error === 'object' ? JSON.stringify(err.error.error) : (err.error?.error || 'Failed to update assignment');
          this.showError(errMsg);
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/skill-assignment`, val).subscribe({
        next: () => {
          this.snackBar.open('Assignment created successfully', 'Close', { duration: 3000 });
          this.loadAssignments();
          this.assignForm.reset();
        },
        error: (err) => {
          const errMsg = typeof err.error?.error === 'object' ? JSON.stringify(err.error.error) : (err.error?.error || 'Failed to create assignment');
          this.showError(errMsg);
        }
      });
    }
  }

  editAssignment(assignment: any) {
    this.editingId = assignment.id;
    
    // Infer the role_id from the verifiers array from the backend response or local users list
    let inferredRoleId = '';
    if (assignment.verifiers && assignment.verifiers.length > 0 && assignment.verifiers[0].role_id) {
      inferredRoleId = assignment.verifiers[0].role_id;
    } else if (assignment.verifier_ids && assignment.verifier_ids.length > 0) {
      const firstVerifier = this.users.find(u => u.id === assignment.verifier_ids[0]);
      if (firstVerifier && firstVerifier.role_id) {
        inferredRoleId = firstVerifier.role_id;
      }
    }

    // Ultimate fallback: if we STILL don't have a role_id, but we know the role name from the verifiers object
    if (!inferredRoleId && assignment.verifiers && assignment.verifiers.length > 0 && assignment.verifiers[0].role?.name) {
      const matchedRole = this.filteredRoles.find(r => r.name === assignment.verifiers[0].role.name);
      if (matchedRole) {
        inferredRoleId = matchedRole.id;
      }
    }

    const finalRoleId = assignment.role_id || inferredRoleId || '';

    // If the inferred role is somehow missing from the loaded roles list (e.g. API filter), 
    // dynamically add it so the dropdown can successfully select and display it.
    if (finalRoleId && !this.filteredRoles.some(r => r.id === finalRoleId)) {
      const verifierUser = this.users.find(u => u.role_id === finalRoleId);
      this.filteredRoles = [...this.filteredRoles, { 
        id: finalRoleId, 
        name: verifierUser ? verifierUser.role : 'Assigned Role' 
      }];
    }

    // Fix the race condition: Manually prepare filteredUsers BEFORE patching the form.
    if (finalRoleId) {
      this.filteredUsers = this.users.filter(u => u.role_id === finalRoleId);
    } else if (assignment.verifiers && assignment.verifiers.length > 0) {
      this.filteredUsers = assignment.verifiers;
    }

    // Manually prepare filteredSections
    if (assignment.grade_ids && assignment.grade_ids.length > 0) {
      this.filteredSections = this.sections.filter(s => assignment.grade_ids.includes(s.grade_id));
    } else {
      this.filteredSections = [];
    }

    // Set flag to prevent valueChanges from clearing fields
    this.isPatching = true;

    // Patch the values in a setTimeout to allow Angular's change detection to 
    // fully render the new filteredUsers into the DOM as <mat-option>s before selection.
    setTimeout(() => {
      this.assignForm.patchValue({
        role_id: finalRoleId,
        verifier_id: assignment.verifier_ids || [],
        skill_type: assignment.skill_types || [],
        grade_id: assignment.grade_ids || [],
        section_id: assignment.section_ids || []
      }, { emitEvent: true }); // ensure valueChanges run to maintain consistency
      
      this.isPatching = false;
    });

    // Scroll to top or just let them see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId = null;
    this.assignForm.reset();
  }

  async deleteAssignment(id: string) {
    const result = await Swal.fire({
      title: 'Delete Assignment?',
      text: 'Are you sure you want to remove this assignment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

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
