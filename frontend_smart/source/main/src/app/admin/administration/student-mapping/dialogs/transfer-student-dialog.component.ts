import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AcademicStructureService } from '../../academic-structure/services/academic-structure.service';
import { AcademicContextSelectorComponent, IAcademicContextSelection } from '@shared/components/academic-context-selector/academic-context-selector.component';

@Component({
  selector: 'app-transfer-student-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, AcademicContextSelectorComponent],
  template: `
    <h2 mat-dialog-title>Transfer Student</h2>
    <mat-dialog-content [formGroup]="transferForm">
      <p class="text-muted">Transferring records this movement in the student's academic history.</p>
      <div class="pt-3">
        <div class="hierarchy-dropdown-wrapper mb-3 border rounded p-2 bg-light">
          <label class="d-block text-muted small fw-bold mb-2">Target Academic Context</label>
          <app-academic-context-selector
            [grades]="data.grades"
            [allSections]="data.sections"
            [selectedGradeId]="transferForm.get('to_grade_id')?.value"
            [selectedSectionId]="transferForm.get('to_section_id')?.value"
            [showSubjects]="false"
            [showGroups]="true"
            [showUnits]="false"
            [showTopics]="false"
            [showSubTopics]="false"
            (selectionChange)="onContextChange($event)"
          ></app-academic-context-selector>
        </div>
        <mat-form-field appearance="outline" class="w-100 mt-2">
          <mat-label>Reason for Transfer</mat-label>
          <textarea matInput formControlName="reason" rows="2" placeholder="e.g. Changed stream to Commerce"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="transferForm.invalid" (click)="onSubmit()">Confirm Transfer</button>
    </mat-dialog-actions>
  `
})
export class TransferStudentDialogComponent implements OnInit {
  transferForm: FormGroup;
  filteredSections: any[] = [];
  subjectGroups: any[] = [];
  private academicService = inject(AcademicStructureService);
  private fb = inject(FormBuilder);

  constructor(
    public dialogRef: MatDialogRef<TransferStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.transferForm = this.fb.group({
      to_grade_id: [data.payload.to_grade_id, Validators.required],
      to_section_id: [data.payload.to_section_id],
      to_subject_group_id: [data.payload.to_subject_group_id],
      reason: [data.payload.reason, Validators.required]
    });
  }

  ngOnInit() {
    this.checkGroups();
  }

  onContextChange(context: IAcademicContextSelection) {
    this.transferForm.patchValue({
      to_grade_id: context.grade?.id || null,
      to_section_id: context.section && context.section !== 'ALL' ? context.section.id : null,
      to_subject_group_id: context.subjectGroup?.id || null
    });
    this.checkGroups();
  }

  checkGroups() {
    const to_grade_id = this.transferForm.get('to_grade_id')?.value;
    const to_section_id = this.transferForm.get('to_section_id')?.value;
    
    if (to_grade_id && to_section_id) {
      this.academicService.getSubjectGroups(to_grade_id, to_section_id).subscribe(groups => {
        this.subjectGroups = groups;
        if (groups.length > 0) {
           this.transferForm.get('to_subject_group_id')?.setValidators([Validators.required]);
        } else {
           this.transferForm.get('to_subject_group_id')?.clearValidators();
        }
        this.transferForm.get('to_subject_group_id')?.updateValueAndValidity();
      });
    } else {
      this.subjectGroups = [];
      this.transferForm.get('to_subject_group_id')?.clearValidators();
      this.transferForm.get('to_subject_group_id')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.transferForm.valid) {
      this.dialogRef.close(this.transferForm.value);
    }
  }
}
