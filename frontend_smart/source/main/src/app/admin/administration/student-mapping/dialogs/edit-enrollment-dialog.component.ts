import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AcademicStructureService } from '../../academic-structure/services/academic-structure.service';

@Component({
  selector: 'app-edit-enrollment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Edit Enrollment (Correction)</h2>
    <mat-dialog-content>
      <div class="pt-3">
        <mat-form-field appearance="outline" class="w-100 mb-3">
          <mat-label>Grade</mat-label>
          <mat-select [(ngModel)]="data.payload.grade_id" (selectionChange)="onGradeChange()">
            <mat-option *ngFor="let g of data.grades" [value]="g.id">{{ g.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-100 mb-3">
          <mat-label>Section</mat-label>
          <mat-select [(ngModel)]="data.payload.section_id" (selectionChange)="onSectionChange()">
            <mat-option [value]="null">None</mat-option>
            <mat-option *ngFor="let s of filteredSections" [value]="s.id">{{ s.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-100 mb-3" *ngIf="subjectGroups.length > 1">
          <mat-label>Subject Group (Stream)</mat-label>
          <mat-select [(ngModel)]="data.payload.subject_group_id">
            <mat-option *ngFor="let sg of subjectGroups" [value]="sg.id">{{ sg.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!data.payload.grade_id || (subjectGroups.length > 0 && !data.payload.subject_group_id)" [mat-dialog-close]="data.payload">Save Correction</button>
    </mat-dialog-actions>
  `
})
export class EditEnrollmentDialogComponent implements OnInit {
  filteredSections: any[] = [];
  subjectGroups: any[] = [];
  private academicService = inject(AcademicStructureService);

  constructor(
    public dialogRef: MatDialogRef<EditEnrollmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.onGradeChange();
    this.data.payload.section_id = this.data.enrollment.section?.id || null;
    this.onSectionChange();
    this.data.payload.subject_group_id = this.data.enrollment.subject_group?.id || null;
  }

  onGradeChange() {
    this.filteredSections = this.data.sections.filter((s: any) => s.grade_id === this.data.payload.grade_id);
    this.onSectionChange();
  }

  onSectionChange() {
    if (this.data.payload.grade_id && this.data.payload.section_id) {
      this.academicService.getSubjectGroups(this.data.payload.grade_id, this.data.payload.section_id).subscribe(groups => {
        this.subjectGroups = groups;
        if (groups.length === 1 && !this.data.payload.subject_group_id) {
          this.data.payload.subject_group_id = groups[0].id;
        }
      });
    } else {
      this.subjectGroups = [];
    }
  }
}
