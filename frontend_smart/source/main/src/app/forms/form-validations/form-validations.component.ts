import { Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-form-validations',
    templateUrl: './form-validations.component.html',
    styleUrls: ['./form-validations.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatOptionModule,
        MatCheckboxModule,
        MatButtonModule,
    ]
})
export class FormValidationsComponent {
  private fb = inject(UntypedFormBuilder);

  // Form 1
  register: UntypedFormGroup;
  hide = true;
  agree = false;
  customForm?: UntypedFormGroup;

  breadscrums = [
    {
      title: 'Validation',
      items: ['Forms'],
      active: 'Validation',
    },
  ];

  constructor() {
    this.register = this.fb.group({
      first: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      last: [''],
      password: ['', [Validators.required]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      address: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      termcondition: [false, [Validators.requiredTrue]],
    });
  }
  onRegister() {
    console.log('Form Value', this.register.value);
  }
}
