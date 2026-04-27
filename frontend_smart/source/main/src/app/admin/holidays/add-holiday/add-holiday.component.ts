import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-add-holiday',
    templateUrl: './add-holiday.component.html',
    styleUrls: ['./add-holiday.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatDatepickerModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
    ]
})
export class AddHolidayComponent {
  private fb = inject(UntypedFormBuilder);

  holidayForm: UntypedFormGroup;
  breadscrums = [
    {
      title: 'Add Holiday',
      items: ['Fees'],
      active: 'Add Holiday',
    },
  ];
  constructor() {
    this.holidayForm = this.fb.group({
      no: ['', [Validators.required]],
      title: ['', [Validators.required]],
      sDate: ['', [Validators.required]],
      eDate: ['', [Validators.required]],
      type: ['', [Validators.required]],
      details: [''],
    });
  }
  onSubmit() {
    console.log('Form Value', this.holidayForm.value);
  }
}
