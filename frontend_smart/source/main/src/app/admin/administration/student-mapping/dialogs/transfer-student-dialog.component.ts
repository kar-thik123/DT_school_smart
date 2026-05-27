import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, AcademicContextSelectorComponent],
  template: `
    <h2 mat-dialog-title>Transfer Student</h2>
    <mat-dialog-content>
      <p class="text-muted">Transferring records this movement in the student's academic history.</p>
      <div class="pt-3">
        <div class="hierarchy-dropdown-wrapper mb-3 border rounded p-2 bg-light">
          <label class="d-block text-muted small fw-bold mb-2">Target Academic Context</label>
          <app-academic-context-selector
            [grades]="data.grades"
            [allSections]="data.sections"
            [selectedGradeId]="data.payload.to_grade_id"
            [selectedSectionId]="data.payload.to_section_id"
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
          <textarea matInput [(ngModel)]="data.payload.reason" rows="2" placeholder="e.g. Changed stream to Commerce"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!data.payload.to_grade_id || (subjectGroups.length > 0 && !data.payload.to_subject_group_id) || !data.payload.reason" [mat-dialog-close]="data.payload">Confirm Transfer</button>
    </mat-dialog-actions>
  `
})
export class TransferStudentDialogComponent implements OnInit {
  filteredSections: any[] = [];
  subjectGroups: any[] = [];
  private academicService = inject(AcademicStructureService);

  constructor(
    public dialogRef: MatDialogRef<TransferStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.checkGroups();
  }

  onContextChange(context: IAcademicContextSelection) {
    this.data.payload.to_grade_id = context.grade?.id || null;
    this.data.payload.to_section_id = context.section && context.section !== 'ALL' ? context.section.id : null;
    this.data.payload.to_subject_group_id = context.subjectGroup?.id || null;
    
    this.checkGroups();
  }

  checkGroups() {
    if (this.data.payload.to_grade_id && this.data.payload.to_section_id) {
      this.academicService.getSubjectGroups(this.data.payload.to_grade_id, this.data.payload.to_section_id).subscribe(groups => {
        this.subjectGroups = groups;
      });
    } else {
      this.subjectGroups = [];
    }
  }
}
