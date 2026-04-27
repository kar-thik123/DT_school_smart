import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-faqs',
    templateUrl: './faqs.component.html',
    styleUrls: ['./faqs.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatExpansionModule,
        MatButtonModule,
        MatIconModule,
    ]
})
export class FaqsComponent {
  breadscrums = [
    {
      title: 'Faqs',
      items: ['Extra'],
      active: 'Faqs',
    },
  ];

  constructor() {
    //constructor
  }
}
