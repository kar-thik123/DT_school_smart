import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-add-fees',
    templateUrl: './add-fees.component.html',
    styleUrls: ['./add-fees.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatOptionModule,
        MatRadioModule,
        MatDatepickerModule,
        MatButtonModule,
    ]
})
export class AddFeesComponent {
  private fb = inject(UntypedFormBuilder);

  feesForm: UntypedFormGroup;
  breadscrums = [
    {
      title: 'Add Fees',
      items: ['Fees'],
      active: 'Add Fees',
    },
  ];
  constructor() {
    this.feesForm = this.fb.group({
      rollNo: ['', [Validators.required]],
      sName: ['', [Validators.required]],
      fType: ['', [Validators.required]],
      department: ['', [Validators.required]],
      date: ['', [Validators.required]],
      invoiceNo: ['', [Validators.required]],
      pType: ['', [Validators.required]],
      status: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      duration: ['', [Validators.required]],
      details: [''],
    });
  }
  onSubmit() {
    console.log('Form Value', this.feesForm.value);
  }
}
