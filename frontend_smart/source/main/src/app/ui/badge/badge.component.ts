import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-badge',
    templateUrl: './badge.component.html',
    styleUrls: ['./badge.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatBadgeModule,
        MatButtonModule,
        MatIconModule,
    ]
})
export class BadgeComponent {
  breadscrums = [
    {
      title: 'Bedge',
      items: ['UI'],
      active: 'Bedge',
    },
  ];

  constructor() {
    //constructor
  }
}
