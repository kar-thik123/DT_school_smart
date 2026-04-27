import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FileUploadComponent } from '@shared/components/file-upload/file-upload.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-add-student',
    templateUrl: './add-student.component.html',
    styleUrls: ['./add-student.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDatepickerModule,
        FileUploadComponent,
        MatButtonModule,
    ]
})
export class AddStudentComponent {
  private fb = inject(UntypedFormBuilder);

  stdForm: UntypedFormGroup;
  breadscrums = [
    {
      title: 'Add Student',
      items: ['Student'],
      active: 'Add Student',
    },
  ];
  constructor() {
    this.stdForm = this.fb.group({
      first: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      last: [''],
      rollNo: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      mobile: ['', [Validators.required]],
      rDate: ['', [Validators.required]],
      department: [''],
      parentName: ['', [Validators.required]],
      parentNo: [''],
      dob: ['', [Validators.required]],
      bGroup: [''],
      address: [''],
      uploadFile: [''],
      // New fields
      studentId: ['', [Validators.required]],
      admissionType: ['regular'],
      grade: ['', [Validators.required]],
      section: [''],
      previousSchool: [''],
      emergencyContactName: ['', [Validators.required]],
      emergencyContactNumber: ['', [Validators.required]],
      medicalInfo: [''],
      transportMode: [''],
      activities: [[]],
    });
  }
  onSubmit() {
    console.log('Form Value', this.stdForm.value);
  }
}
