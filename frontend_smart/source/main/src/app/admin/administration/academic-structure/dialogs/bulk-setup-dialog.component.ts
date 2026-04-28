import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { AcademicStructureService } from '../services/academic-structure.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bulk-setup-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule,
    MatStepperModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>Quick Setup Wizard</h2>
    <mat-dialog-content class="mat-typography">
      <mat-stepper [linear]="true" #stepper>
        
        <!-- Step 1: Grades -->
        <mat-step [stepControl]="gradesForm">
          <form [formGroup]="gradesForm">
            <ng-template matStepLabel>Define Grades</ng-template>
            <div class="pt-3">
              <p class="text-muted">Enter all the grades your institution offers (e.g., "Nursery", "LKG", "Grade 1"). Press Enter after each.</p>
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Grades</mat-label>
                <mat-chip-grid #chipGridGrades aria-label="Enter grades">
                  <mat-chip-row *ngFor="let grade of gradesList" (removed)="removeGrade(grade)">
                    {{grade}}
                    <button matChipRemove [attr.aria-label]="'remove ' + grade">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                  <input placeholder="New grade..."
                         [matChipInputFor]="chipGridGrades"
                         [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                         [matChipInputAddOnBlur]="true"
                         (matChipInputTokenEnd)="addGrade($event)">
                </mat-chip-grid>
              </mat-form-field>
              <div class="text-danger small" *ngIf="gradesList.length === 0 && gradesForm.touched">At least one grade is required.</div>
            </div>
            <div class="mt-3 text-end">
              <button mat-raised-button color="primary" matStepperNext [disabled]="gradesList.length === 0">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Sections -->
        <mat-step [stepControl]="sectionsForm">
          <form [formGroup]="sectionsForm">
            <ng-template matStepLabel>Define Sections</ng-template>
            <div class="pt-3">
              <p class="text-muted">Enter standard sections applied to all grades (e.g., "A", "B", "C"). You can adjust specific ones later.</p>
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Sections</mat-label>
                <mat-chip-grid #chipGridSections aria-label="Enter sections">
                  <mat-chip-row *ngFor="let section of sectionsList" (removed)="removeSection(section)">
                    {{section}}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                  <input placeholder="New section..."
                         [matChipInputFor]="chipGridSections"
                         [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                         [matChipInputAddOnBlur]="true"
                         (matChipInputTokenEnd)="addSection($event)">
                </mat-chip-grid>
              </mat-form-field>
            </div>
            <div class="mt-3 text-end">
              <button mat-button matStepperPrevious class="me-2">Back</button>
              <button mat-raised-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Subjects -->
        <mat-step [stepControl]="subjectsForm">
          <form [formGroup]="subjectsForm">
            <ng-template matStepLabel>Base Subjects</ng-template>
            <div class="pt-3">
              <p class="text-muted">Enter subjects taught across all grades (e.g., "English", "Mathematics"). Grade-specific subjects can be added later.</p>
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Subjects</mat-label>
                <mat-chip-grid #chipGridSubjects aria-label="Enter subjects">
                  <mat-chip-row *ngFor="let subject of subjectsList" (removed)="removeSubject(subject)">
                    {{subject.name}}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                  <input placeholder="New subject..."
                         [matChipInputFor]="chipGridSubjects"
                         [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                         [matChipInputAddOnBlur]="true"
                         (matChipInputTokenEnd)="addSubject($event)">
                </mat-chip-grid>
              </mat-form-field>
              <div class="text-danger small" *ngIf="subjectsList.length === 0 && subjectsForm.touched">At least one subject is required.</div>
            </div>
            <div class="mt-3 text-end">
              <button mat-button matStepperPrevious class="me-2">Back</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="subjectsList.length === 0">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 4: Review -->
        <mat-step>
          <ng-template matStepLabel>Review & Finish</ng-template>
          <div class="pt-3">
            <p class="mb-4">You are about to scaffold your institution's academic structure.</p>
            <div class="row">
              <div class="col-4"><strong>Grades:</strong></div>
              <div class="col-8">{{ gradesList.join(', ') }}</div>
            </div>
            <hr>
            <div class="row">
              <div class="col-4"><strong>Sections per Grade:</strong></div>
              <div class="col-8">{{ sectionsList.length > 0 ? sectionsList.join(', ') : '(None)' }}</div>
            </div>
            <hr>
            <div class="row">
              <div class="col-4"><strong>Global Subjects:</strong></div>
              <div class="col-8">
                 <span *ngFor="let s of subjectsList; let last=last">{{ s.name }}{{ last ? '' : ', ' }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4 text-end">
            <button mat-button matStepperPrevious class="me-2" [disabled]="isSubmitting">Back</button>
            <button mat-raised-button color="accent" (click)="submitBulkSetup()" [disabled]="isSubmitting">
              <mat-icon class="me-2">{{ isSubmitting ? 'hourglass_empty' : 'check_circle' }}</mat-icon>
              Confirm & Generate
            </button>
          </div>
        </mat-step>

      </mat-stepper>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isSubmitting">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .mat-mdc-dialog-content { padding: 0 24px 24px; }
  `]
})
export class BulkSetupDialogComponent {
  private fb = inject(FormBuilder);
  private academicService = inject(AcademicStructureService);
  private dialogRef = inject(MatDialogRef<BulkSetupDialogComponent>);
  private snackBar = inject(MatSnackBar);

  isSubmitting = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  gradesForm: FormGroup = this.fb.group({});
  sectionsForm: FormGroup = this.fb.group({});
  subjectsForm: FormGroup = this.fb.group({});

  gradesList: string[] = [];
  sectionsList: string[] = [];
  subjectsList: { name: string; type: string }[] = [];

  // Grades Handlers
  addGrade(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.gradesList.includes(value)) this.gradesList.push(value);
    event.chipInput!.clear();
  }
  removeGrade(grade: string): void {
    const index = this.gradesList.indexOf(grade);
    if (index >= 0) this.gradesList.splice(index, 1);
  }

  // Sections Handlers
  addSection(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.sectionsList.includes(value)) this.sectionsList.push(value);
    event.chipInput!.clear();
  }
  removeSection(section: string): void {
    const index = this.sectionsList.indexOf(section);
    if (index >= 0) this.sectionsList.splice(index, 1);
  }

  // Subjects Handlers
  addSubject(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.subjectsList.find(s => s.name === value)) this.subjectsList.push({ name: value, type: 'MANDATORY' });
    event.chipInput!.clear();
  }
  removeSubject(subject: any): void {
    const index = this.subjectsList.indexOf(subject);
    if (index >= 0) this.subjectsList.splice(index, 1);
  }

  submitBulkSetup() {
    if (this.gradesList.length === 0 || this.subjectsList.length === 0) return;

    this.isSubmitting = true;
    
    // Construct payload as expected by /api/academic/bulk-setup
    const payload = {
      grades: this.gradesList,
      sections: this.sectionsList.length > 0 ? this.sectionsList : undefined,
      subjects: this.subjectsList
    };

    this.academicService.bulkSetup(payload).subscribe({
      next: (res) => {
        this.snackBar.open('Academic Structure successfully configured!', '', { duration: 3000, panelClass: 'snackbar-success' });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to setup academic structure', '', { duration: 4000, panelClass: 'snackbar-error' });
        this.isSubmitting = false;
      }
    });
  }
}
