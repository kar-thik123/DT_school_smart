import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-fee-receipt',
    templateUrl: './fee-receipt.component.html',
    styleUrls: ['./fee-receipt.component.scss'],
    imports: [BreadcrumbComponent, MatButtonModule]
})
export class FeeReceiptComponent {
  breadscrums = [
    {
      title: 'Receipt',
      items: ['Fees'],
      active: 'Receipt',
    },
  ];
  constructor() {
    //constructor
  }
}
