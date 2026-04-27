import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-result-preview',
  templateUrl: './result-preview.component.html',
  styleUrls: ['./result-preview.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class ResultPreviewComponent {
  private fb = inject(UntypedFormBuilder);
  previewForm: UntypedFormGroup;

  breadscrums = [
    {
      title: 'Result Preview',
      items: ['Teacher', 'Examination'],
      active: 'Preview',
    },
  ];

  constructor() {
    this.previewForm = this.fb.group({
      studentName: ['', [Validators.required]],
      rollNo: ['', [Validators.required]],
      class: ['', [Validators.required]],
      examType: ['', [Validators.required]],
    });
  }

  onPreview() {
    console.log('Previewing results for', this.previewForm.value);
  }
}
