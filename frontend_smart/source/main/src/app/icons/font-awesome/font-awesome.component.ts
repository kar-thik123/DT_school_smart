import { Component } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-font-awesome',
    templateUrl: './font-awesome.component.html',
    styleUrls: ['./font-awesome.component.scss'],
    imports: [BreadcrumbComponent]
})
export class FontAwesomeComponent {
  breadscrums = [
    {
      title: 'Font-awesome',
      items: ['Icons'],
      active: 'Font-awesome',
    },
  ];
  constructor() {
    //constructor
  }
}
