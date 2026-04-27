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
    selector: 'app-edit-teacher',
    templateUrl: './edit-teacher.component.html',
    styleUrls: ['./edit-teacher.component.scss'],
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
export class EditTeacherComponent {
  private fb = inject(UntypedFormBuilder);

  proForm: UntypedFormGroup;
  formdata = {
    first: 'Pooja',
    last: 'Sarma',
    gender: 'female',
    mobile: '123456789',
    password: '123',
    conformPassword: '123',
    employeeId: 'TCH001',
    email: 'test@example.com',
    designation: 'Sr. Teacher',
    department: 'science',
    address: '101, Elanxa, New Yourk',
    dob: '1987-02-17T14:22:18Z',
    joiningDate: '2015-06-01T09:00:00Z',
    experience: '8',
    education: 'M.Sc.,P.H.D.',
    qualifications: 'Certified Teacher, Subject Matter Expert',
    subjectsTaught: 'Physics, Chemistry, Environmental Science',
    emergencyContactName: 'Rahul Sarma',
    emergencyContactNumber: '9876543210',
    uploadFile: '',
  };
  breadscrums = [
    {
      title: 'Edit Teacher',
      items: ['Teacher'],
      active: 'Edit Teacher',
    },
  ];
  constructor() {
    this.proForm = this.createContactForm();
  }
  onSubmit() {
    console.log('Form Value', this.proForm.value);
  }
  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      first: [
        this.formdata.first,
        [Validators.required, Validators.pattern('[a-zA-Z]+')],
      ],
      last: [this.formdata.last],
      gender: [this.formdata.gender, [Validators.required]],
      mobile: [this.formdata.mobile, [Validators.required]],
      password: [this.formdata.password],
      conformPassword: [this.formdata.conformPassword],
      employeeId: [this.formdata.employeeId, [Validators.required]],
      email: [
        this.formdata.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      designation: [this.formdata.designation],
      department: [this.formdata.department],
      address: [this.formdata.address],
      dob: [this.formdata.dob, [Validators.required]],
      joiningDate: [this.formdata.joiningDate, [Validators.required]],
      experience: [this.formdata.experience],
      education: [this.formdata.education],
      qualifications: [this.formdata.qualifications],
      subjectsTaught: [this.formdata.subjectsTaught],
      emergencyContactName: [this.formdata.emergencyContactName],
      emergencyContactNumber: [this.formdata.emergencyContactNumber],
      uploadFile: [this.formdata.uploadFile],
    });
  }
}
