import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-list-group',
    templateUrl: './list-group.component.html',
    styleUrls: ['./list-group.component.scss'],
    imports: [BreadcrumbComponent, MatListModule]
})
export class ListGroupComponent {
  typesOfShoes: string[] = [
    'Boots',
    'Clogs',
    'Loafers',
    'Moccasins',
    'Sneakers',
  ];

  breadscrums = [
    {
      title: 'List Group',
      items: ['UI'],
      active: 'List Group',
    },
  ];

  constructor() {
    //constructor
  }
}
