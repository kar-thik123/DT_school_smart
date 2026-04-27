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
    selector: 'app-edit-student',
    templateUrl: './edit-student.component.html',
    styleUrls: ['./edit-student.component.scss'],
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
export class EditStudentComponent {
  private fb = inject(UntypedFormBuilder);

  stdForm: UntypedFormGroup;
  formdata = {
    first: 'Pooja',
    last: 'Sarma',
    rollNo: '12',
    gender: 'male',
    email: 'test@example.com',
    mobile: '123456789',
    rDate: '2020-02-05T14:22:18Z',
    department: 'mathematics',
    bGroup: 'O+',
    dob: '1987-02-17T14:22:18Z',
    parentName: 'Sanjay Shukla',
    parentNo: '1234567890',
    address: '101, Elanxa, New Yourk',
    uploadFile: '',
    // New fields
    studentId: 'STD-2023-001',
    admissionType: 'regular',
    grade: '10',
    section: 'A',
    previousSchool: 'ABC School',
    emergencyContactName: 'Rahul Sharma',
    emergencyContactNumber: '9876543210',
    medicalInfo: 'No allergies',
    transportMode: 'school_bus',
    activities: ['sports', 'music'],
  };
  breadscrums = [
    {
      title: 'Edit Student',
      items: ['Student'],
      active: 'Edit Student',
    },
  ];
  constructor() {
    this.stdForm = this.createContactForm();
  }
  onSubmit() {
    console.log('Form Value', this.stdForm.value);
  }
  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      first: [
        this.formdata.first,
        [Validators.required, Validators.pattern('[a-zA-Z]+')],
      ],
      last: [this.formdata.last],
      rollNo: [this.formdata.rollNo],
      gender: [this.formdata.gender, [Validators.required]],
      mobile: [this.formdata.mobile, [Validators.required]],
      rDate: [this.formdata.rDate, [Validators.required]],
      email: [
        this.formdata.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      department: [this.formdata.department],
      parentName: [this.formdata.parentName, [Validators.required]],
      parentNo: [this.formdata.parentNo],
      dob: [this.formdata.dob, [Validators.required]],
      bGroup: [this.formdata.bGroup],
      address: [this.formdata.address],
      uploadFile: [this.formdata.uploadFile],
      // New fields
      studentId: [this.formdata.studentId, [Validators.required]],
      admissionType: [this.formdata.admissionType],
      grade: [this.formdata.grade, [Validators.required]],
      section: [this.formdata.section],
      previousSchool: [this.formdata.previousSchool],
      emergencyContactName: [this.formdata.emergencyContactName, [Validators.required]],
      emergencyContactNumber: [this.formdata.emergencyContactNumber, [Validators.required]],
      medicalInfo: [this.formdata.medicalInfo],
      transportMode: [this.formdata.transportMode],
      activities: [this.formdata.activities],
    });
  }
}
