import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

import { QuestionBankService, IQuestion } from './services/question-bank.service';
import { AcademicStructureService, IGrade, ISection, ISubject } from '../units-list/services/units.service';
import { CurriculumService, ICurriculumUnit, ICurriculumTopic, ICurriculumSubTopic } from '../units-list/services/curriculum.service';
import { QuestionBankDropdownComponent } from './questionBank-dropdown/questionBank-dropdown.component';
import { QuestionBankPreviewComponent } from './question-bank-preview/question-bank-preview.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent,
    MatIconModule, MatButtonModule, MatCardModule,
    MatMenuModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatProgressBarModule,
    QuestionBankDropdownComponent, QuestionBankPreviewComponent
  ],
  templateUrl: './question-bank.component.html',
  styleUrls: ['./question-bank.component.scss']
})
export class QuestionBankComponent implements OnInit {
  private fb = inject(FormBuilder);
  private questionService = inject(QuestionBankService);
  private academicService = inject(AcademicStructureService);
  private curriculumService = inject(CurriculumService);
  private snackBar = inject(MatSnackBar);

  breadscrums = [
    {
      title: 'Question Bank',
      items: ['Administration'],
      active: 'Question Bank',
    },
  ];

  isLoading = false;
  questionForm!: FormGroup;

  // Context Data
  grades: IGrade[] = [];
  allSections: ISection[] = [];
  subjects: ISubject[] = [];
  
  // Curriculum Data (Cached for selected Subject)
  // Removed local arrays in favor of backend API parameters

  // Filtered dropdown data based on form selection
  // Removed local arrays in favor of backend API parameters

  // Questions Data
  allQuestions: IQuestion[] = [];
  filteredQuestions: IQuestion[] = [];

  // State
  selectedGradeId: string | null = null;
  selectedSectionId: string | null = null;
  selectedGradeName: string = '';
  selectedSectionName: string = '';
  selectedSubjectId: string | null = null;
  selectedSubjectName: string = '';
  selectedUnitId: string | null = null;
  selectedUnitName: string = '';
  selectedTopicId: string | null = null;
  selectedTopicName: string = '';
  selectedSubTopicId: string | null = null;
  selectedSubTopicName: string = '';
  
  editingQuestionId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadGrades();
    this.loadAllSections();
  }

  initForm() {
    this.questionForm = this.fb.group({
      subject_id: [''],
      unit_id: [''],
      topic_id: [''],
      sub_topic_id: [null],
      question_text: ['', Validators.required],
      type: ['MCQ_SINGLE', Validators.required],
      marks: [1, [Validators.required, Validators.min(1)]],
      difficulty: ['MEDIUM', Validators.required],
      is_important: [false],
      // Options and Answers
      optionA: [''],
      optionB: [''],
      optionC: [''],
      optionD: [''],
      correct_answer_mcq: [0],
      correct_answers_multi: [[]],
      correct_answer_tf: [true],
      answer_text: ['']
    });

    // Cascading selection logic for form
    this.questionForm.get('subject_id')?.valueChanges.subscribe(subjectId => {
      this.questionForm.patchValue({ unit_id: '', topic_id: '', sub_topic_id: null });
    });

    this.questionForm.get('unit_id')?.valueChanges.subscribe(unitId => {
      this.questionForm.patchValue({ topic_id: '', sub_topic_id: null });
    });

    this.questionForm.get('topic_id')?.valueChanges.subscribe(topicId => {
      this.questionForm.patchValue({ sub_topic_id: null });
    });

    // Dynamic Option and Answer validation logic
    this.questionForm.get('type')?.valueChanges.subscribe(type => {
      const optionA = this.questionForm.get('optionA');
      const optionB = this.questionForm.get('optionB');
      const correctMcq = this.questionForm.get('correct_answer_mcq');
      const correctMulti = this.questionForm.get('correct_answers_multi');
      const correctTF = this.questionForm.get('correct_answer_tf');

      if (type === 'MCQ_SINGLE' || type === 'MCQ_MULTI') {
        optionA?.setValidators([Validators.required]);
        optionB?.setValidators([Validators.required]);
      } else {
        optionA?.clearValidators();
        optionB?.clearValidators();
      }

      if (type === 'MCQ_SINGLE') {
        correctMcq?.setValidators([Validators.required]);
      } else {
        correctMcq?.clearValidators();
      }

      if (type === 'MCQ_MULTI') {
        correctMulti?.setValidators([Validators.required]);
      } else {
        correctMulti?.clearValidators();
      }

      if (type === 'TRUE_FALSE') {
        correctTF?.setValidators([Validators.required]);
      } else {
        correctTF?.clearValidators();
      }

      optionA?.updateValueAndValidity();
      optionB?.updateValueAndValidity();
      correctMcq?.updateValueAndValidity();
      correctMulti?.updateValueAndValidity();
      correctTF?.updateValueAndValidity();
    });

    // Run type changes once to set default validators
    this.questionForm.get('type')?.updateValueAndValidity();
  }

  // --- Academic Structure Loading ---
  loadGrades() {
    this.academicService.getGrades().subscribe(grades => {
      this.grades = grades;
    });
  }

  loadAllSections() {
    this.academicService.getSections().subscribe(sections => {
      this.allSections = sections;
    });
  }

  // Preview State
  showPreviewModal = false;
  previewData: any[] = [];
  previewCsvFile: File | null = null;

  onFileImport(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      this.snackBar.open('Cannot use multiple files', 'Close', { duration: 3000 });
      return;
    }
    const file = target.files[0];
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        // Prepare preview data - filter out rows that don't have an actual question
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);
        this.previewData = rawData.filter(row => {
          return row.question && String(row.question).trim() !== '';
        });
        if (!this.previewData || this.previewData.length === 0) {
          this.snackBar.open('No data found in the Excel file.', 'Close', { duration: 3000 });
          return;
        }

        // Convert parsed Excel data directly to CSV string for backend
        const csv = XLSX.utils.sheet_to_csv(ws);
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        this.previewCsvFile = new File([csvBlob], 'import.csv', { type: 'text/csv' });
        
        // Show modal
        this.showPreviewModal = true;
      } catch (err) {
        console.error('Error reading Excel file:', err);
        this.snackBar.open('Invalid Excel file format.', 'Close', { duration: 3000 });
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = null; // reset input
  }

  discardImport() {
    this.showPreviewModal = false;
    this.previewData = [];
    this.previewCsvFile = null;
  }

  confirmImport() {
    if (!this.previewCsvFile) return;
    this.isLoading = true;
    this.showPreviewModal = false;
    this.questionService.uploadBulkCsv(this.previewCsvFile).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open(res.message || 'Data imported successfully!', 'Close', { duration: 5000 });
        this.discardImport(); // clear state
        this.loadGrades(); // Refresh grades in dropdown
        this.loadCurriculumAndQuestions();
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        const msg = err.error?.message || 'Error importing data.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.discardImport(); // clear state
      }
    });
  }

  selectGradeSectionSubjectForQuestion(
    grade: IGrade,
    section: ISection | 'ALL' | null,
    subject: any | null,
    unit?: any,
    topic?: any,
    subTopic?: any
  ) {
    this.selectedGradeId = grade?.id || null;
    this.selectedGradeName = grade?.name || '';
    this.selectedSectionId = section === 'ALL' ? 'ALL' : section?.id || null;
    this.selectedSectionName = section === 'ALL' ? 'All Sections' : section?.name || '';
    this.selectedSubjectId = subject?.id || null;
    this.selectedSubjectName = subject?.name || '';
    
    this.selectedUnitId = unit?.id || null;
    this.selectedUnitName = unit?.name || '';
    this.selectedTopicId = topic?.id || null;
    this.selectedTopicName = topic?.name || '';
    this.selectedSubTopicId = subTopic?.id || null;
    this.selectedSubTopicName = subTopic?.name || '';

    // Reset Form
    this.cancelEdit(null as any);
    
    // Load subjects for grade, then patch form selection
    if (grade?.id) {
      this.academicService.getSubjects(grade.id).subscribe(subjects => {
        this.subjects = subjects;
        
        this.questionForm.patchValue({
          subject_id: subject?.id || '',
          unit_id: unit?.id || '',
          topic_id: topic?.id || '',
          sub_topic_id: subTopic?.id || null
        });
      });
    }

    this.loadCurriculumAndQuestions();
  }

  loadCurriculumAndQuestions() {
    this.isLoading = true;
    
    // Efficient Backend Fetching: Only fetch exactly the questions that match the selected hierarchy context.
    const params: any = {};
    if (this.selectedGradeId) params.grade_id = this.selectedGradeId;
    if (this.selectedSectionId && this.selectedSectionId !== 'ALL') params.section_id = this.selectedSectionId;
    if (this.selectedSubjectId) params.subject_id = this.selectedSubjectId;
    if (this.selectedUnitId) params.unit_id = this.selectedUnitId;
    if (this.selectedTopicId) params.topic_id = this.selectedTopicId;
    if (this.selectedSubTopicId) params.sub_topic_id = this.selectedSubTopicId;

    this.questionService.getQuestions(params).subscribe({
      next: (questions) => {
        this.allQuestions = questions || [];
        this.filteredQuestions = [...this.allQuestions]; // No local filtering needed, API handled it!
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('error', 'Failed to load questions');
      }
    });
  }

  // --- CRUD Operations ---
  saveQuestion(formDirective: FormGroupDirective | null) {
    if (this.questionForm.invalid) return;

    const formValue = this.questionForm.value;
    
    let answer_config: any = {};
    let answer: string | undefined = undefined;

    if (formValue.type === 'MCQ_SINGLE') {
      const opts = [formValue.optionA, formValue.optionB, formValue.optionC, formValue.optionD].filter(o => o && o.trim() !== '');
      answer_config = {
        options: opts.length >= 2 ? opts : ['Option A', 'Option B'],
        correct_answer: Number(formValue.correct_answer_mcq)
      };
      answer = String(answer_config.correct_answer);
    } else if (formValue.type === 'MCQ_MULTI') {
      const opts = [formValue.optionA, formValue.optionB, formValue.optionC, formValue.optionD].filter(o => o && o.trim() !== '');
      answer_config = {
        options: opts.length >= 2 ? opts : ['Option A', 'Option B'],
        correct_answers: formValue.correct_answers_multi || []
      };
      answer = (formValue.correct_answers_multi || []).join(',');
    } else if (formValue.type === 'TRUE_FALSE') {
      answer_config = {
        correct_answer: formValue.correct_answer_tf === true || String(formValue.correct_answer_tf) === 'true'
      };
      answer = String(answer_config.correct_answer);
    } else {
      // LONG_ANSWER or other types
      answer_config = {};
      answer = formValue.answer_text;
    }
    
    const payload = {
       subject_id: formValue.subject_id || null,
       unit_id: formValue.unit_id || null,
       topic_id: formValue.topic_id || null,
       sub_topic_id: formValue.sub_topic_id || null,
       grade_id: this.selectedGradeId,
       section_id: this.selectedSectionId === 'ALL' ? null : this.selectedSectionId,
       question_text: formValue.question_text,
       type: formValue.type,
       marks: Number(formValue.marks),
       difficulty: formValue.difficulty,
       is_important: formValue.is_important === true,
       answer_config,
       answer
    };

    if (this.editingQuestionId) {
      this.questionService.updateQuestion(this.editingQuestionId, payload).subscribe({
        next: (res) => {
          this.showNotification('success', 'Question updated successfully');
          const index = this.allQuestions.findIndex(q => q.id === this.editingQuestionId);
          if (index !== -1) {
            this.allQuestions[index] = { ...this.allQuestions[index], ...res.question };
          }
          this.filteredQuestions = [...this.allQuestions];
          this.cancelEdit(formDirective);
        },
        error: (err) => this.showNotification('error', `Failed to update question: ${err.error?.message || err.message}`)
      });
    } else {
      this.questionService.createQuestion(payload).subscribe({
        next: (res) => {
          this.showNotification('success', 'Question created successfully');
          this.allQuestions.unshift(res.question);
          this.filteredQuestions = [...this.allQuestions];
          this.cancelEdit(formDirective);
        },
        error: (err) => {
          console.error('Create Question Error:', err);
          this.showNotification('error', `Failed to create question: ${err.error?.message || err.message}`);
        }
      });
    }
  }

  editQuestion(question: IQuestion) {
    this.editingQuestionId = question.id;
    // Set the values. Because of cascading subscriptions, we need to carefully patch.
    this.questionForm.patchValue({
      subject_id: question.subject_id,
    });
    setTimeout(() => {
      this.questionForm.patchValue({ unit_id: question.unit_id });
      setTimeout(() => {
         this.questionForm.patchValue({ topic_id: question.topic_id });
         setTimeout(() => {
            // Extract options and correct answers
            let optA = '';
            let optB = '';
            let optC = '';
            let optD = '';
            let correctMcq = 0;
            let correctMulti: number[] = [];
            let correctTF = true;
            let answerText = question.answer || '';

            if (question.answer_config) {
              const config = question.answer_config as any;
              if (config.options) {
                optA = config.options[0] || '';
                optB = config.options[1] || '';
                optC = config.options[2] || '';
                optD = config.options[3] || '';
              }
              if (config.correct_answer !== undefined) {
                if (question.type === 'TRUE_FALSE') {
                  correctTF = config.correct_answer === true || String(config.correct_answer) === 'true';
                } else {
                  correctMcq = Number(config.correct_answer);
                }
              }
              if (config.correct_answers) {
                correctMulti = config.correct_answers;
              }
            }

            this.questionForm.patchValue({
               sub_topic_id: question.sub_topic_id || null,
               question_text: question.question_text,
               type: question.type,
               marks: question.marks,
               difficulty: question.difficulty,
               is_important: question.is_important,
               optionA: optA,
               optionB: optB,
               optionC: optC,
               optionD: optD,
               correct_answer_mcq: correctMcq,
               correct_answers_multi: correctMulti,
               correct_answer_tf: correctTF,
               answer_text: answerText
            });
         }, 50);
      }, 50);
    }, 50);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(formDirective: FormGroupDirective | null) {
    this.editingQuestionId = null;
    
    // Remember current context selections before clearing
    const subject_id = this.questionForm?.value.subject_id || this.selectedSubjectId;
    const unit_id = this.questionForm?.value.unit_id || this.selectedUnitId;
    const topic_id = this.questionForm?.value.topic_id || this.selectedTopicId;
    const sub_topic_id = this.questionForm?.value.sub_topic_id || this.selectedSubTopicId;

    if (formDirective) {
      formDirective.resetForm({
        subject_id, unit_id, topic_id, sub_topic_id,
        type: 'MCQ_SINGLE', marks: 1, difficulty: 'MEDIUM', is_important: false
      });
    } else if (this.questionForm) {
       this.questionForm.reset({
        subject_id, unit_id, topic_id, sub_topic_id,
        type: 'MCQ_SINGLE', marks: 1, difficulty: 'MEDIUM', is_important: false
      });
    }
  }

  deleteQuestion(question: IQuestion) {
    Swal.fire({
      text: `Do you want to delete this question?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
         // Optimistic delete
         this.allQuestions = this.allQuestions.filter(q => q.id !== question.id);
         this.filteredQuestions = [...this.allQuestions];
         
         this.questionService.deleteQuestion(question.id).subscribe({
            next: () => this.showNotification('success', 'Question deleted'),
            error: () => {
               this.showNotification('error', 'Failed to delete question');
               this.allQuestions.push(question); // rollback
               this.filteredQuestions = [...this.allQuestions];
            }
         });
      }
    });
  }

  // --- Helpers for Table Display ---
  getContextHierarchy(q: any): string {
    const parts: string[] = [];
    
    if (q.grade_id && q.grade?.name) parts.push(q.grade.name);
    if (q.section_id && q.section?.name) parts.push(q.section.name);
    if (q.subject_id && q.subject?.name) parts.push(q.subject.name);
    if (q.unit_id && q.unit?.name) parts.push(q.unit.name);
    if (q.topic_id && q.topic?.name) parts.push(q.topic.name);
    if (q.sub_topic_id && q.sub_topic?.name) parts.push(q.sub_topic.name);
    
    if (parts.length === 0) return 'Generic Grade Level';
    
    return parts.slice(-3).join(' > ');
  }

  getInvalidControlsNames(): string[] {
    const invalid = [];
    const controls = this.questionForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        let label = name;
        if (name === 'subject_id') label = 'Subject';
        else if (name === 'unit_id') label = 'Unit';
        else if (name === 'topic_id') label = 'Topic';
        else if (name === 'question_text') label = 'Question Text';
        else if (name === 'optionA') label = 'Option A';
        else if (name === 'optionB') label = 'Option B';
        else if (name === 'correct_answer_mcq') label = 'Correct MCQ Option';
        else if (name === 'correct_answers_multi') label = 'Correct Multi Options';
        else if (name === 'correct_answer_tf') label = 'Correct True/False Answer';
        invalid.push(label);
      }
    }
    return invalid;
  }

  private showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
