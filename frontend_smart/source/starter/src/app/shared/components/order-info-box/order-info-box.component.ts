import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-order-info-box',
    imports: [MatCardModule, CommonModule],
    templateUrl: './order-info-box.component.html',
    styleUrl: './order-info-box.component.scss'
})
export class OrderInfoBoxComponent {
  readonly title = input<string>('');
  readonly value = input<string | number>('');
  readonly percentageText = input<string>('');
  readonly iconClass = input<string>('');
  readonly bgClass = input<string>('');
}
