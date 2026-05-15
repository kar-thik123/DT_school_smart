import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcademicStructureService, ISubjectGroup, ISubject } from '../services/units.service';

@Component({
  selector: 'app-subject-group-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Manage Group / Stream: <span class="text-primary">{{ data.group.name }}</span></h2>
    
    <div mat-dialog-content class="pt-3 pb-2" style="min-height: 300px;">
      <div *ngIf="isLoading" class="d-flex justify-content-center align-items-center h-100">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading">
        <form [formGroup]="form">
          <mat-form-field appearance="outline" class="w-100 mb-3">
            <mat-label>Group / Stream Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Science Group">
            <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
          </mat-form-field>

          <h5 class="mb-3 text-muted">Subject Mappings</h5>
          <div class="row align-items-center mb-2 fw-bold text-muted px-2">
            <div class="col-6">Subject</div>
            <div class="col-4">Type</div>
            <div class="col-2 text-end">Action</div>
          </div>
          
          <div formArrayName="subjects">
            <div *ngFor="let subjectCtrl of subjectsFormArray.controls; let i=index" [formGroupName]="i" class="row align-items-center mb-2 border-bottom pb-2 pt-2 bg-light rounded px-2">
              <div class="col-6">
                <mat-form-field appearance="outline" class="w-100 mb-0 no-subscript">
                  <mat-select formControlName="subject_id" placeholder="Select Subject">
                    <mat-option *ngFor="let s of allSubjects" [value]="s.id">{{ s.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-4">
                <mat-form-field appearance="outline" class="w-100 mb-0 no-subscript">
                  <mat-select formControlName="subject_type">
                    <mat-option value="MANDATORY">Mandatory</mat-option>
                    <mat-option value="OPTIONAL">Optional</mat-option>
                    <mat-option value="ELECTIVE">Elective</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-2 text-end">
                <button mat-icon-button color="warn" type="button" (click)="removeSubject(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
            <div *ngIf="subjectsFormArray.length === 0" class="text-center p-3 text-muted border border-dashed rounded">
              No subjects mapped. Click 'Add Subject' below.
            </div>
          </div>

          <button mat-stroked-button color="primary" type="button" class="mt-3 w-100 border-dashed" (click)="addSubject()">
            <mat-icon>add</mat-icon> Add Subject
          </button>
        </form>
      </div>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isSaving">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || isSaving || isLoading">
        <mat-icon class="me-2" *ngIf="!isSaving">save</mat-icon>
        <mat-spinner diameter="20" class="me-2" *ngIf="isSaving"></mat-spinner>
        {{ isSaving ? 'Saving...' : 'Save Group' }}
      </button>
    </div>
  `,
  styles: [`
    .no-subscript ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    .border-dashed {
      border-style: dashed !important;
    }
  `]
})
export class SubjectGroupDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private academicService = inject(AcademicStructureService);

  form: FormGroup;
  allSubjects: ISubject[] = [];
  isLoading = true;
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<SubjectGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: ISubjectGroup, gradeId: string }
  ) {
    this.form = this.fb.group({
      name: [this.data.group.name, Validators.required],
      subjects: this.fb.array([])
    });
  }

  get subjectsFormArray() {
    return this.form.get('subjects') as FormArray;
  }

  ngOnInit() {
    this.loadAvailableSubjects();
  }

  loadAvailableSubjects() {
    this.academicService.getSubjects(this.data.gradeId).subscribe({
      next: (subjects) => {
        this.allSubjects = subjects;
        this.populateForm();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  populateForm() {
    if (this.data.group.subjects && this.data.group.subjects.length > 0) {
      this.data.group.subjects.forEach(s => {
        this.subjectsFormArray.push(this.fb.group({
          subject_id: [s.id, Validators.required],
          subject_type: [s.subject_type || 'MANDATORY', Validators.required]
        }));
      });
    }
  }

  addSubject() {
    this.subjectsFormArray.push(this.fb.group({
      subject_id: ['', Validators.required],
      subject_type: ['MANDATORY', Validators.required]
    }));
  }

  removeSubject(index: number) {
    this.subjectsFormArray.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.isSaving = true;
    const payload = this.form.value;

    this.academicService.updateSubjectGroup(this.data.group.id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
      }
    });
  }
}
