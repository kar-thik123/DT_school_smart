import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

interface InvoiceItem {
  no: number;
  description: string;
  quantity: string;
  unitPrice: string;
  charges: string;
  discount: string;
  total: string;
}

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
  ],
})
export class InvoiceComponent {
  displayedColumns: string[] = [
    'no',
    'description',
    'quantity',
    'unitPrice',
    'charges',
    'discount',
    'total',
  ];

  invoiceItems: InvoiceItem[] = [
    {
      no: 1,
      description: 'Tuition Fees',
      quantity: '-',
      unitPrice: '-',
      charges: '$500',
      discount: '-',
      total: '$500',
    },
    {
      no: 2,
      description: 'Books & Supplies',
      quantity: '5',
      unitPrice: '$20',
      charges: '$100',
      discount: '10%',
      total: '$90',
    },
    {
      no: 3,
      description: 'Sports Fees',
      quantity: '1',
      unitPrice: '$200',
      charges: '$200',
      discount: '5%',
      total: '$190',
    },
    {
      no: 4,
      description: 'Field Trip',
      quantity: '1',
      unitPrice: '$50',
      charges: '$50',
      discount: '5%',
      total: '$47.5',
    },
    {
      no: 5,
      description: 'Other Charges',
      quantity: '-',
      unitPrice: '-',
      charges: '-',
      discount: '-',
      total: '$50',
    },
  ];

  constructor() {
    // constructor code
  }
}
