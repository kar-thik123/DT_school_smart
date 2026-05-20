import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-question-bank-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './question-bank-preview.component.html',
  styleUrl: './question-bank-preview.component.scss',
})
export class QuestionBankPreviewComponent {
  @Input() previewData: any[] = [];
  @Output() discard = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
