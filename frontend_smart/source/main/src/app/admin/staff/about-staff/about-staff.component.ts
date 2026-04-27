import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-about-staff',
    templateUrl: './about-staff.component.html',
    styleUrls: ['./about-staff.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatTabsModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule,
    ]
})
export class AboutStaffComponent {
  breadscrums = [
    {
      title: 'Profile',
      items: ['Staff'],
      active: 'Profile',
    },
  ];
  constructor() {
    // constructor;
  }
}
