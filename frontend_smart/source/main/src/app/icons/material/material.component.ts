import { Component } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-material',
    templateUrl: './material.component.html',
    styleUrls: ['./material.component.scss'],
    imports: [BreadcrumbComponent]
})
export class MaterialComponent {
  breadscrums = [
    {
      title: 'Material',
      items: ['Icons'],
      active: 'Material',
    },
  ];
  constructor() {
    //constructor
  }
}
