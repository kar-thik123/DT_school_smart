import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-add-asset',
    templateUrl: './add-asset.component.html',
    styleUrls: ['./add-asset.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDatepickerModule,
        MatButtonModule,
    ]
})
export class AddAssetComponent {
  private fb = inject(UntypedFormBuilder);

  libraryForm: UntypedFormGroup;
  breadscrums = [
    {
      title: 'Add Asset',
      items: ['Library'],
      active: 'Add Asset',
    },
  ];
  constructor() {
    this.libraryForm = this.fb.group({
      no: ['', [Validators.required]],
      title: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      autherName: [''],
      publisher: [''],
      department: ['', [Validators.required]],
      aType: ['', [Validators.required]],
      date: ['', [Validators.required]],
      price: ['', [Validators.required]],
      status: [''],
      details: [''],
    });
  }
  onSubmit() {
    console.log('Form Value', this.libraryForm.value);
  }
}
