import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormGroupDirective, FormArray } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { QuestionBankService, IQuestion } from './services/question-bank.service';
import { AcademicStructureService, IGrade, ISection, ISubject } from '../units-list/services/units.service';
import { CurriculumService, ICurriculumUnit, ICurriculumTopic, ICurriculumSubTopic } from '../units-list/services/curriculum.service';
import { AcademicContextSelectorComponent, IAcademicContextSelection } from '@shared/components/academic-context-selector/academic-context-selector.component';
import { QuestionBankPreviewComponent } from './question-bank-preview/question-bank-preview.component';
import Swal from 'sweetalert2';
import { AuthService } from '@core';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent,
    MatIconModule, MatButtonModule, MatCardModule,
    MatMenuModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatProgressBarModule, MatTabsModule, MatCheckboxModule, MatPaginatorModule,
    AcademicContextSelectorComponent, QuestionBankPreviewComponent
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
  private authService = inject(AuthService);
  private router = inject(Router);

  breadscrums = [
    {
      title: 'Question Bank',
      items: ['Administration'],
      active: 'Question Bank',
    },
  ];

  isLoading = false;
  activeTabIndex = 0;
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
  paginatedQuestions: IQuestion[] = [];

  // Pagination states
  currentPage = 1;
  pageSize = 10;

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
  canImport = false;
  capabilities = {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canImport: false
  };

  ngOnInit() {
    const isTeacherPath = this.router.url.startsWith('/teacher/');
    const parentPath = isTeacherPath ? 'Teacher' : 'Administration';
    this.breadscrums = [
      {
        title: 'Question Bank',
        items: [parentPath],
        active: 'Question Bank',
      },
    ];

    this.capabilities.canCreate = this.authService.hasPermission('QUESTION_BANK', 'CREATE') ||
                                 this.authService.hasPermission('QUESTION_BANK_CREATE');
    this.capabilities.canEdit = this.authService.hasPermission('QUESTION_BANK', 'EDIT') ||
                               this.authService.hasPermission('QUESTION_BANK_EDIT');
    this.capabilities.canDelete = this.authService.hasPermission('QUESTION_BANK', 'DELETE') ||
                                 this.authService.hasPermission('QUESTION_BANK_DELETE');
    this.capabilities.canImport = this.authService.hasPermission('QUESTION_BANK', 'IMPORT') ||
                                 this.authService.hasPermission('QUESTION_BANK_IMPORT');
    this.canImport = this.capabilities.canImport;

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
      options: this.fb.array([]),
      correct_answer_mcq: [0],
      correct_answers_multi: [[]],
      correct_answer_tf: [true],
      answer_text: ['']
    });

    // Cascading selection logic for form
    this.questionForm.get('subject_id')?.valueChanges.subscribe(subjectId => {
      this.questionForm.patchValue({ unit_id: '', topic_id: '', sub_topic_id: null }, { emitEvent: false });
    });

    this.questionForm.get('unit_id')?.valueChanges.subscribe(unitId => {
      this.questionForm.patchValue({ topic_id: '', sub_topic_id: null }, { emitEvent: false });
    });

    this.questionForm.get('topic_id')?.valueChanges.subscribe(topicId => {
      this.questionForm.patchValue({ sub_topic_id: null }, { emitEvent: false });
    });

    // Dynamic Option and Answer validation logic
    this.questionForm.get('type')?.valueChanges.subscribe(type => {
      const correctMcq = this.questionForm.get('correct_answer_mcq');
      const correctMulti = this.questionForm.get('correct_answers_multi');
      const correctTF = this.questionForm.get('correct_answer_tf');

      correctMcq?.clearValidators();
      correctMulti?.clearValidators();
      correctTF?.clearValidators();

      correctMcq?.updateValueAndValidity({ emitEvent: false });
      correctMulti?.updateValueAndValidity({ emitEvent: false });
      correctTF?.updateValueAndValidity({ emitEvent: false });
    });

    // Run type changes once to set default validators
    this.questionForm.get('type')?.updateValueAndValidity();
  }

  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  addOption() {
    this.options.push(this.fb.group({
      text: ['', Validators.required],
      isCorrect: [false]
    }));
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }

  onCheckboxChange(event: any, index: number) {
    if (this.questionForm.get('type')?.value === 'MCQ_SINGLE' && event.checked) {
      this.options.controls.forEach((control, i) => {
        if (i !== index) {
          control.get('isCorrect')?.setValue(false, { emitEvent: false });
        }
      });
    }
  }

  hasCorrectOption(): boolean {
    const type = this.questionForm.get('type')?.value;
    if (type !== 'MCQ_SINGLE' && type !== 'MCQ_MULTI') return true;
    return this.options.controls.some(ctrl => ctrl.get('isCorrect')?.value === true);
  }

  hasMinimumOptions(): boolean {
    const type = this.questionForm.get('type')?.value;
    if (type !== 'MCQ_SINGLE' && type !== 'MCQ_MULTI') return true;
    return this.options.length >= 2;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
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
  previewSummary: any = {};
  previewSessionId: string | null = null;

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

        // Convert parsed Excel data directly to CSV string for backend
        const csv = XLSX.utils.sheet_to_csv(ws);
        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvFile = new File([csvBlob], 'import.csv', { type: 'text/csv' });

        this.isLoading = true;
        this.questionService.uploadBulkCsvPreview(csvFile).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.previewSessionId = res.session_id;
            this.previewSummary = res.summary || {};
            this.previewData = res.records || [];
            this.showPreviewModal = true;
          },
          error: (err) => {
            this.isLoading = false;
            console.error(err);
            this.snackBar.open(err.error?.message || 'Error processing preview.', 'Close', { duration: 5000 });
          }
        });
      } catch (err) {
        console.error('Error reading Excel file:', err);
        this.snackBar.open('Invalid Excel file format.', 'Close', { duration: 3000 });
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = null; // reset input
  }

  discardImport() {
    if (this.previewSessionId) {
      this.questionService.discardBulkImport(this.previewSessionId).subscribe({
        next: () => {},
        error: (err) => console.error('Error discarding preview', err)
      });
    }
    this.showPreviewModal = false;
    this.previewData = [];
    this.previewSummary = {};
    this.previewSessionId = null;
  }



  revalidateImport(modifiedRecords: any[]) {
    this.isLoading = true;
    
    // Create CSV header matching the backend parse expectations (which maps back exactly)
    const header = [
      'grade', 'section', 'subject', 'unit_lesson', 'topic', 'sub_topic',
      'question_type', 'question', 'option1', 'option2', 'option3', 'option4',
      'correct_options', 'true_false_answer', 'yes_no_answer', 'fill_blank_sentence',
      'fill_blank_answers', 'answer', 'marks', 'difficulty_level', 'important_question',
      'repeated_question', 'prepared_by'
    ];
    
    const csvRows = [header.join(',')];
    
    for (const r of modifiedRecords) {
      const row = header.map(field => {
        const val = r[field] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const csvBlob = new Blob([csvString], { type: 'text/csv' });
    const csvFile = new File([csvBlob], 'import.csv', { type: 'text/csv' });

    this.questionService.uploadBulkCsvPreview(csvFile).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.previewSessionId = res.session_id;
        this.previewSummary = res.summary || {};
        this.previewData = res.records || [];
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.snackBar.open(err.error?.message || 'Error re-validating preview.', 'Close', { duration: 5000 });
      }
    });
  }

  confirmImport(modifiedRecords?: any[]) {
    if (!this.previewSessionId) return;
    this.isLoading = true;
    this.showPreviewModal = false;
    this.questionService.confirmBulkImport(this.previewSessionId, modifiedRecords).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open(res.message || 'Data imported successfully!', 'Close', { duration: 5000 });
        this.previewSessionId = null; // clear it so discard doesn't fire again
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

  selectGradeSectionSubjectForQuestion(selection: IAcademicContextSelection) {
    const { grade, section, subject, unit, topic, subTopic } = selection;
    this.selectedGradeId = grade?.id || null;
    this.selectedGradeName = grade?.name || '';
    this.selectedSectionId = section === 'ALL' ? 'ALL' : section?.id || null;
    this.selectedSectionName = section === 'ALL' ? 'All Sections' : section?.name || '';
    this.selectedSubjectId = (subject as any)?.subject_id || subject?.id || null;
    this.selectedSubjectName = subject?.name || (subject as any)?.subject?.name || '';

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
        }, { emitEvent: false });
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
        this.currentPage = 1;
        this.updatePaginatedList();
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
      const opts = formValue.options || [];
      const optTexts = opts.map((o: any) => o.text).filter((t: string) => t && t.trim() !== '');
      const correctIndex = opts.findIndex((o: any) => o.isCorrect === true);

      answer_config = {
        options: optTexts.length > 0 ? optTexts : ['Option A', 'Option B'],
        correct_answer: correctIndex >= 0 ? correctIndex : 0
      };
      answer = String(answer_config.correct_answer);
    } else if (formValue.type === 'MCQ_MULTI') {
      const opts = formValue.options || [];
      const optTexts = opts.map((o: any) => o.text).filter((t: string) => t && t.trim() !== '');
      const correctIndices = opts.map((o: any, i: number) => o.isCorrect ? i : -1).filter((i: number) => i !== -1);

      answer_config = {
        options: optTexts.length > 0 ? optTexts : ['Option A', 'Option B'],
        correct_answers: correctIndices
      };
      answer = correctIndices.join(',');
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
          this.updatePaginatedList();
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
          this.updatePaginatedList();
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
    this.activeTabIndex = 0; // Switch to Create Question tab
    // Set the values. Because of cascading subscriptions, we need to carefully patch.
    this.questionForm.patchValue({
      subject_id: question.subject_id,
      unit_id: question.unit_id,
      topic_id: question.topic_id,
      sub_topic_id: question.sub_topic_id || null,
      question_text: question.question_text,
      type: question.type,
      marks: question.marks,
      difficulty: question.difficulty,
      is_important: question.is_important
    }, { emitEvent: false });

    this.options.clear();
    let correctMcq = 0;
    let correctMulti: number[] = [];
    let correctTF = true;
    let answerText = question.answer || '';

    if (question.answer_config) {
      const config = question.answer_config as any;
      if (config.options && Array.isArray(config.options)) {
        config.options.forEach((optText: string, i: number) => {
          let isCorrect = false;
          if (question.type === 'MCQ_SINGLE') {
            isCorrect = (Number(config.correct_answer) === i);
          } else if (question.type === 'MCQ_MULTI') {
            isCorrect = (Array.isArray(config.correct_answers) && config.correct_answers.includes(i));
          }
          this.options.push(this.fb.group({ text: [optText, Validators.required], isCorrect: [isCorrect] }));
        });
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
      correct_answer_mcq: correctMcq,
      correct_answers_multi: correctMulti,
      correct_answer_tf: correctTF,
      answer_text: answerText
    }, { emitEvent: false });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(formDirective: FormGroupDirective | null) {
    this.editingQuestionId = null;
    this.options.clear();

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
      // We still need to patch without emitting to fix the form directive bug 
      // where it triggers valueChanges after resetForm
      this.questionForm.patchValue({
        subject_id, unit_id, topic_id, sub_topic_id
      }, { emitEvent: false });
    } else if (this.questionForm) {
      this.questionForm.reset({
        subject_id, unit_id, topic_id, sub_topic_id,
        type: 'MCQ_SINGLE', marks: 1, difficulty: 'MEDIUM', is_important: false
      }, { emitEvent: false });
    }
  }

  private http = inject(HttpClient);

  downloadTemplate(): void {
    const fileUrl = 'assets/Global_questionBank_template/Question_Bank_Template.xlsx';

    this.http.get(fileUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Question_Bank_Template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading template', err);
        this.snackBar.open('Failed to download template', 'Close', { duration: 3000 });
      }
    });
  }

  exportExcel(): void {
    if (!this.filteredQuestions || this.filteredQuestions.length === 0) {
      this.showNotification('error', 'No data to export');
      return;
    }

    const data = this.filteredQuestions.map((q: any, index: number) => {
      let optionsStr = '';
      let correctAnsStr = '';
      if (q.type === 'MCQ_SINGLE' || q.type === 'MCQ_MULTI') {
        const config = q.answer_config as any;
        optionsStr = config?.options?.join(' | ') || '';

        if (q.type === 'MCQ_SINGLE' && config?.correct_answer !== undefined) {
          correctAnsStr = config.options[config.correct_answer] || '';
        } else if (q.type === 'MCQ_MULTI' && config?.correct_answers) {
          correctAnsStr = config.correct_answers.map((i: number) => config.options[i]).join(', ');
        }
      } else if (q.type === 'TRUE_FALSE') {
        correctAnsStr = q.answer_config?.correct_answer ? 'True' : 'False';
      } else {
        correctAnsStr = q.answer || '';
      }

      return {
        'S.No': index + 1,
        'Grade': q.grade?.name || '',
        'Section': q.section?.name || '',
        'Subject': q.subject?.name || '',
        'Unit': q.unit?.name || '',
        'Topic': q.topic?.name || '',
        'Sub Topic': q.sub_topic?.name || '',
        'Question Type': q.type,
        'Question': q.question_text,
        'Options (separated by |)': optionsStr,
        'Correct Answer': correctAnsStr,
        'Marks': q.marks,
        'Difficulty': q.difficulty,
        'Important': q.is_important ? 'Yes' : 'No'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'Questions': worksheet }, SheetNames: ['Questions'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const formattedDate = formatter.format(now).replace(/\//g, '-').replace(/:/g, '-').replace(', ', '_');
      a.download = `Question_Bank_${formattedDate}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        this.allQuestions = this.allQuestions.filter(q => q.id !== question.id);
        this.filteredQuestions = [...this.allQuestions];
        
        // Handle page adjustment when deleting the last item on a page
        const maxPages = Math.ceil(this.filteredQuestions.length / this.pageSize);
        if (this.currentPage > maxPages && this.currentPage > 1) {
          this.currentPage--;
        }
        this.updatePaginatedList();

        this.questionService.deleteQuestion(question.id).subscribe({
          next: () => this.showNotification('success', 'Question deleted'),
          error: () => {
            this.showNotification('error', 'Failed to delete question');
            this.allQuestions.push(question); // rollback
            this.filteredQuestions = [...this.allQuestions];
            this.updatePaginatedList();
          }
        });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.updatePaginatedList();
  }

  updatePaginatedList() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedQuestions = this.filteredQuestions.slice(startIndex, startIndex + this.pageSize);
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
        invalid.push(label);
      }
    }
    if (!this.hasCorrectOption()) {
      invalid.push('Correct Option (check a box)');
    }
    if (!this.hasMinimumOptions()) {
      invalid.push('Minimum 2 Options Required');
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
