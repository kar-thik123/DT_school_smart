import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { QuestionBankDropdownComponent } from './components/mcq-dropdown/mcq-dropdown.component';
import { MatIconModule } from '@angular/material/icon';
import { McqPreviewComponent } from './mcq-preview/mcq-preview.component';
import confetti from 'canvas-confetti';

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
    MatDialogModule,
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

  @ViewChild('scoreDialog') scoreDialog!: TemplateRef<any>;

  constructor(private http: HttpClient, private dialog: MatDialog, private route: ActivatedRoute, private router: Router) { }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['subject_id']) {
        this.selectedSubjectId = params['subject_id'];
        this.selectedSubjectName = params['subject_name'] || '';
        this.selectedSubTopicId = params['sub_topic_id'] || null;
        this.selectedSubTopicName = params['sub_topic_name'] || '';
        this.selectedTopicId = params['topic_id'] || null;
        this.selectedTopicName = params['topic_name'] || '';
        this.selectedUnitId = params['unit_id'] || null;
        this.selectedUnitName = params['unit_name'] || '';
        
        this.fetchQuestions();
      }
    });
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

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        subject_id: this.selectedSubjectId || null,
        subject_name: this.selectedSubjectName || null,
        unit_id: this.selectedUnitId || null,
        unit_name: this.selectedUnitName || null,
        topic_id: this.selectedTopicId || null,
        topic_name: this.selectedTopicName || null,
        sub_topic_id: this.selectedSubTopicId || null,
        sub_topic_name: this.selectedSubTopicName || null
      },
      queryParamsHandling: 'merge'
    });
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

    let attemptUrl = `${environment.apiUrl}/student-mcq/attempts/count?subject_id=${this.selectedSubjectId}`;
    if (this.selectedUnitId) attemptUrl += `&unit_id=${this.selectedUnitId}`;
    if (this.selectedTopicId) attemptUrl += `&topic_id=${this.selectedTopicId}`;
    if (this.selectedSubTopicId) attemptUrl += `&sub_topic_id=${this.selectedSubTopicId}`;

    this.http.get(attemptUrl).subscribe({
      next: (res: any) => {
        this.attemptsCount = res.attempt_count || 0;
      },
      error: (err) => console.error('Error fetching attempt count', err)
    });

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

    const dialogRef = this.dialog.open(this.scoreDialog, {
      data: {
        correctAnswers: correctAnswers,
        totalQuestions: this.questions.length,
        timeTaken: this.formattedTotalTime,
        attemptCount: this.attemptsCount
      },
      width: '400px',
      disableClose: true
    });

    this.blastConfetti();

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.resetQuiz();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (result === 'answers') {
        this.showResults = true;
        window.setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    });

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

  blastConfetti() {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      zIndex: 10000
    });
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
