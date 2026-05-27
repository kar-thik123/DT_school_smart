import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { QuestionBankDropdownComponent } from './components/mcq-dropdown/mcq-dropdown.component';
import { MatIconModule } from '@angular/material/icon';
import { McqPreviewComponent } from './mcq-preview/mcq-preview.component';

@Component({
  selector: 'app-student-mcq',
  templateUrl: './mcq.component.html',
  styleUrls: ['./mcq.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatRadioModule,
    MatButtonModule,
    MatCheckboxModule,
    BreadcrumbComponent,
    QuestionBankDropdownComponent,
    MatIconModule,
    McqPreviewComponent
  ]
})
export class McqComponent implements OnInit {
  // Dropdown states
  grades: any[] = [];
  allSections: any[] = [];
  
  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;
  selectedSubjectId: string | null = null;
  selectedUnitId: string | null = null;
  selectedTopicId: string | null = null;
  selectedSubTopicId: string | null = null;

  selectedGradeName: string = '';
  selectedSectionName: string = '';
  selectedSubjectName: string = '';
  selectedUnitName: string = '';
  selectedTopicName: string = '';
  selectedSubTopicName: string = '';

  questions: any[] = [];
  loadingQuestions = false;

  // Track student answers
  studentAnswers: { [key: string]: any } = {};
  showResults = false;
  quizStarted = false;

  // Timer
  timerInterval: any;
  elapsedSeconds: number = 0;
  totalTimeTaken: number = 0;

  // Attempts
  attemptsCount: number = 0;
  attemptStartTime: Date | null = null;

  constructor(private http: HttpClient) {}

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  ngOnInit(): void {
  }

  selectGradeSectionSubjectForQuestion(grade: any, section: any, subject: any, unit: any, topic: any, subTopic: any) {
    this.selectedGradeId = grade ? grade.id : null;
    this.selectedSectionId = section && section !== 'ALL' ? section.id : null;
    this.selectedSubjectId = subject ? subject.id : null;
    this.selectedUnitId = unit ? unit.id : null;
    this.selectedTopicId = topic ? topic.id : null;
    this.selectedSubTopicId = subTopic ? subTopic.id : null;
    
    this.selectedGradeName = grade ? grade.name : '';
    this.selectedSectionName = section && section !== 'ALL' ? section.name : '';
    this.selectedSubjectName = subject ? subject.name : '';
    this.selectedUnitName = unit ? unit.name : '';
    this.selectedTopicName = topic ? topic.name : '';
    this.selectedSubTopicName = subTopic ? subTopic.name : '';

    this.fetchQuestions();
  }

  fetchQuestions() {
    if (!this.selectedSubjectId) {
      this.questions = [];
      return;
    }

    this.loadingQuestions = true;
    let url = `${environment.apiUrl}/student-mcq/questions?subject_id=${this.selectedSubjectId}`;
    if (this.selectedUnitId) url += `&unit_id=${this.selectedUnitId}`;
    if (this.selectedTopicId) url += `&topic_id=${this.selectedTopicId}`;
    if (this.selectedSubTopicId) url += `&sub_topic_id=${this.selectedSubTopicId}`;

    this.http.get(url).subscribe({
      next: (res: any) => {
        this.questions = res || [];
        this.studentAnswers = {};
        this.showResults = false;
        
        // initialize multiple choice answers
        this.questions.forEach(q => {
          if (q.type === 'MCQ_MULTI') {
            this.studentAnswers[q.id] = [];
          }
        });
        
        this.quizStarted = false;
        this.elapsedSeconds = 0;
        this.attemptsCount = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.loadingQuestions = false;
      },
      error: (err) => {
        console.error('Error fetching questions', err);
        this.loadingQuestions = false;
      }
    });
  }

  toggleMultiAnswer(questionId: string, optionIndex: number, event: any) {
    if (!this.studentAnswers[questionId]) {
      this.studentAnswers[questionId] = [];
    }
    const arr = this.studentAnswers[questionId];
    if (event.checked) {
      arr.push(optionIndex);
    } else {
      const idx = arr.indexOf(optionIndex);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  submitPractice() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showResults = true;
    this.attemptsCount++;
    this.totalTimeTaken = this.elapsedSeconds;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Calculate correct answers
    let correctAnswers = 0;
    for (const q of this.questions) {
      if (this.isCorrect(q)) {
        correctAnswers++;
      }
    }

    const endTime = new Date();

    // Call API to save the attempt
    const payload = {
      subject_id: this.selectedSubjectId,
      unit_id: this.selectedUnitId,
      topic_id: this.selectedTopicId,
      sub_topic_id: this.selectedSubTopicId,
      attempt_count: this.attemptsCount,
      start_time: this.attemptStartTime ? this.attemptStartTime.toISOString() : new Date().toISOString(),
      end_time: endTime.toISOString(),
      total_questions: this.questions.length,
      correct_answers: correctAnswers
    };

    this.http.post(`${environment.apiUrl}/student-mcq/attempts`, payload).subscribe({
      next: (res) => console.log('Attempt saved successfully', res),
      error: (err) => console.error('Failed to save attempt', err)
    });
  }

  startQuiz() {
    this.quizStarted = true;
    this.elapsedSeconds = 0;
    this.attemptStartTime = new Date();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  resetQuiz() {
    this.showResults = false;
    this.studentAnswers = {};
    this.quizStarted = false;
    this.elapsedSeconds = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  get formattedTime(): string {
    const m = Math.floor(this.elapsedSeconds / 60);
    const s = this.elapsedSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get formattedTotalTime(): string {
    const m = Math.floor(this.totalTimeTaken / 60);
    const s = this.totalTimeTaken % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  isCorrect(question: any): boolean {
    if (question.type === 'MCQ_SINGLE') {
      return this.studentAnswers[question.id] === question.answer_config.correct_answer;
    } else if (question.type === 'MCQ_MULTI') {
      const selected = this.studentAnswers[question.id] || [];
      const correct = question.answer_config.correct_answers || [];
      if (selected.length !== correct.length) return false;
      
      const sortedSelected = [...selected].sort();
      const sortedCorrect = [...correct].sort();
      return sortedSelected.every((val, index) => val === sortedCorrect[index]);
    }
    return false;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

}
