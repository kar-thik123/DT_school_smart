import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-about-teacher',
    templateUrl: './about-teacher.component.html',
    styleUrls: ['./about-teacher.component.scss'],
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
export class AboutTeacherComponent {
  breadscrums = [
    {
      title: 'Profile',
      items: ['Teacher'],
      active: 'Profile',
    },
  ];
  constructor() {
    // constructor
  }
}
