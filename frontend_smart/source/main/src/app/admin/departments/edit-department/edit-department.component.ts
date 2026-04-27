import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-edit-department',
    templateUrl: './edit-department.component.html',
    styleUrls: ['./edit-department.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatInputModule,
        MatIconModule,
        MatDatepickerModule,
        MatButtonModule,
    ]
})
export class EditDepartmentComponent {
  private fb = inject(UntypedFormBuilder);

  departmentForm: UntypedFormGroup;
  formdata = {
    dName: 'mathematics',
    hod: 'Sanjay Shah',
    phone: '123456789',
    email: 'test@example.com',
    sYear: '1987-02-17T14:22:18Z',
    sCapacity: '230',
    details: 'Learn fashion designing course with proper guideline.',
    buildingName: 'Main Building',
    numClassrooms: '10',
    departmentWebsite: 'www.example.com/math',
  };
  breadscrums = [
    {
      title: 'Edit Department',
      items: ['Department'],
      active: 'Edit',
    },
  ];
  constructor() {
    this.departmentForm = this.createContactForm();
  }
  onSubmit() {
    console.log('Form Value', this.departmentForm.value);
  }
  createContactForm(): UntypedFormGroup {
    return this.fb.group({
      dName: [this.formdata.dName, [Validators.required]],
      hod: [this.formdata.hod],
      phone: [this.formdata.phone, [Validators.required]],
      email: [
        this.formdata.email,
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      sYear: [this.formdata.sYear],
      sCapacity: [this.formdata.sCapacity],
      details: [this.formdata.details],
      buildingName: [this.formdata.buildingName],
      numClassrooms: [this.formdata.numClassrooms],
      departmentWebsite: [this.formdata.departmentWebsite],
    });
  }
}
