import { Component } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-about-course',
    templateUrl: './about-course.component.html',
    styleUrls: ['./about-course.component.scss'],
    imports: [BreadcrumbComponent, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule]
})
export class AboutCourseComponent {
  breadscrums = [
    {
      title: 'About Course',
      items: ['Course'],
      active: 'About Course',
    },
  ];
  constructor() {
    // constructor
  }
}
