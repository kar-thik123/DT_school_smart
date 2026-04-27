import { Component } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-basic-table',
    templateUrl: './basic-table.component.html',
    styleUrls: ['./basic-table.component.scss'],
    imports: [BreadcrumbComponent]
})
export class BasicTableComponent {
  breadscrums = [
    {
      title: 'Basic',
      items: ['Tables'],
      active: 'Basic',
    },
  ];
  constructor() {
    //constructor
  }
}
