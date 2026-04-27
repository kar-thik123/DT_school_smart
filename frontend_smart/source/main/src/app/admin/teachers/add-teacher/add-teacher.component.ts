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
    selector: 'app-add-teacher',
    templateUrl: './add-teacher.component.html',
    styleUrls: ['./add-teacher.component.scss'],
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
export class AddTeacherComponent {
  private fb = inject(UntypedFormBuilder);

  proForm: UntypedFormGroup;
  breadscrums = [
    {
      title: 'Add Teacher',
      items: ['Teacher'],
      active: 'Add Teacher',
    },
  ];
  constructor() {
    this.proForm = this.fb.group({
      first: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      last: [''],
      gender: ['', [Validators.required]],
      mobile: ['', [Validators.required]],
      password: ['', [Validators.required]],
      conformPassword: ['', [Validators.required]],
      employeeId: ['', [Validators.required]],
      designation: [''],
      department: [''],
      address: [''],
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      dob: ['', [Validators.required]],
      joiningDate: ['', [Validators.required]],
      experience: [''],
      education: [''],
      qualifications: [''],
      subjectsTaught: [''],
      emergencyContactName: [''],
      emergencyContactNumber: [''],
      uploadFile: [''],
    });
  }
  onSubmit() {
    console.log('Form Value', this.proForm.value);
  }
}
