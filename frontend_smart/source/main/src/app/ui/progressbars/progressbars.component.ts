import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-progressbars',
    templateUrl: './progressbars.component.html',
    styleUrls: ['./progressbars.component.scss'],
    imports: [BreadcrumbComponent, MatProgressBarModule]
})
export class ProgressbarsComponent {
  breadscrums = [
    {
      title: 'Progress',
      items: ['UI'],
      active: 'Progress',
    },
  ];

  constructor() {
    //constructor
  }
}
