import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mcq-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatRadioModule, MatCheckboxModule, FormsModule],
  templateUrl: './mcq-preview.component.html',
  styleUrls: ['./mcq-preview.component.scss'],
})
export class McqPreviewComponent {
  @Input() questions: any[] = [];
  @Input() studentAnswers: any = {};

  isCorrect(question: any): boolean {
    if (question.type === 'MCQ_SINGLE') {
      return this.studentAnswers[question.id] === question.answer_config.correct_answer;
    } else if (question.type === 'MCQ_MULTI') {
      const selected = this.studentAnswers[question.id] || [];
      const correct = question.answer_config.correct_answers || [];
      if (selected.length !== correct.length) return false;

      const sortedSelected = [...selected].sort();
      const sortedCorrect = [...correct].sort();
      return sortedSelected.every((val: any, index: number) => val === sortedCorrect[index]);
    }
    return false;
  }

  getCorrectAnswerText(question: any): string {
    if (question.type === 'MCQ_SINGLE') {
      const idx = question.answer_config?.correct_answer;
      if (idx !== undefined && question.answer_config?.options) {
        return question.answer_config.options[idx];
      }
    } else if (question.type === 'MCQ_MULTI') {
      const indices = question.answer_config?.correct_answers;
      if (indices && indices.length > 0 && question.answer_config?.options) {
        return indices.map((idx: number) => question.answer_config.options[idx]).join(', ');
      }
    }
    return '';
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }
}
