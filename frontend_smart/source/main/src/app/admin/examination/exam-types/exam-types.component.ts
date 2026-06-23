import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, NgForm, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExamTypesService, Examination } from './exam-types.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatDialog } from '@angular/material/dialog';
import { DeleteComponent } from './dialogs/delete/delete.component';
import { AuthService } from '@core';

import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-exam-types',
  templateUrl: './exam-types.component.html',
  styleUrls: ['./exam-types.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatMenuModule,
    MatPaginatorModule,
    BreadcrumbComponent
  ],
})
export class ExamTypesComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private examService = inject(ExamTypesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  private destroy$ = new Subject<void>();
  examinations: Examination[] = [];
  isLoading = false;
  isSaving = false;
  canManage = false;

  currentPage = 1;
  pageSize = 10;

  examForm: FormGroup;
  editingExamId: string | null = null;

  constructor() {
    this.examForm = this.fb.group({
      exam_name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.canManage = this.authService.hasPermission('EXAMINATION', 'MANAGE') || 
                     this.authService.hasPermission('EXAMINATION_MANAGE');
    this.loadExaminations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadExaminations(): void {
    this.isLoading = true;
    this.examService.getAllExaminations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.examinations = data.data || data || [];
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.showNotification('snackbar-danger', 'Failed to load examinations');
          this.isLoading = false;
        }
      });
  }

  get paginatedExaminations() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.examinations.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }

  saveExam(formDirective: FormGroupDirective): void {
    if (this.examForm.invalid) return;

    this.isSaving = true;
    const payload = this.examForm.value;

    if (this.editingExamId) {
      this.examService.updateExamination(this.editingExamId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showNotification('snackbar-success', 'Examination updated successfully');
            this.resetForm(formDirective);
            this.loadExaminations();
          },
          error: (err) => {
            console.error(err);
            const msg = err.error?.message || 'Failed to update examination';
            this.showNotification('snackbar-danger', msg);
            this.isSaving = false;
          }
        });
    } else {
      this.examService.createExamination(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showNotification('snackbar-success', 'Examination created successfully');
            this.resetForm(formDirective);
            this.loadExaminations();
            // User requested to stay on the same page after successful creation
          },
          error: (err) => {
            console.error(err);
            const msg = err.error?.message || 'Failed to create examination';
            this.showNotification('snackbar-danger', msg);
            this.isSaving = false;
          }
        });
    }
  }

  editExam(exam: Examination): void {
    this.editingExamId = exam.id!;
    this.examForm.patchValue({
      exam_name: exam.exam_name
    });
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteExam(exam: Examination): void {
    Swal.fire({
      text: `Do you want to delete this record: "${exam.exam_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.examService.deleteExamination(exam.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showNotification('snackbar-danger', 'Examination deleted successfully');
              this.loadExaminations();
            },
            error: (err) => {
              console.error(err);
              this.showNotification('snackbar-danger', 'Failed to delete examination');
            }
          });
      }
    });
  }

  cancelEdit(formDirective: FormGroupDirective): void {
    this.resetForm(formDirective);
  }

  resetForm(formDirective: FormGroupDirective): void {
    this.editingExamId = null;
    this.examForm.reset();
    formDirective.resetForm();
    this.isSaving = false;
  }

  showNotification(colorName: string, text: string): void {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: colorName,
    });
  }
}
