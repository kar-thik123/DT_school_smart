import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { DocumentService } from '../../document.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { formatDate } from '@angular/common';
import { MyDocument } from '../../document.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DialogData {
  id: number;
  action: string;
  document: MyDocument;
}

@Component({
  selector: 'app-document-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  standalone: true,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogClose,
  ],
})
export class DocumentFormComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  dialogRef = inject<MatDialogRef<DocumentFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  documentService = inject(DocumentService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  documentForm: UntypedFormGroup;
  document: MyDocument;
  isDragOver = false;
  selectedFile: File | null = null;
  
  constructor() {
    this.action = this.data.action;
    if (this.action === 'edit') {
      this.dialogTitle = `Edit Document: ${this.data.document.name}`;
      this.document = this.data.document;
    } else {
      this.dialogTitle = 'Upload New Document';
      this.document = {} as MyDocument;
    }
    this.documentForm = this.createDocumentForm();
  }

  createDocumentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.document.id],
      name: [this.document.name, [Validators.required]],
      type: [this.document.type || 'ID Proof', [Validators.required]],
      uploadDate: [this.document.uploadDate || new Date(), [Validators.required]],
      size: [this.document.size, [Validators.required]],
      fileUrl: [this.document.fileUrl],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.documentForm.valid) {
      const formData = this.documentForm.getRawValue();
      formData.uploadDate = formatDate(this.documentForm.value.uploadDate, 'yyyy-MM-dd', 'en-US');
      
      // Add the selected file if available
      if (this.selectedFile) {
        formData.file = this.selectedFile;
      }

      if (this.action === 'edit') {
        this.documentService.updateDocument(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
          },
        });
      } else {
        this.documentService.addDocument(formData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
          },
        });
      }
    }
  }



  onNoClick(): void {
    this.dialogRef.close();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, XLS, XLSX files are allowed.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File size exceeds 10MB limit.');
      return;
    }
    
    this.selectedFile = file;
    
    // Update the form with file info
    this.documentForm.patchValue({
      name: file.name.split('.')[0], // Set name to filename without extension
      size: this.formatFileSize(file.size),
      fileUrl: URL.createObjectURL(file) // Create a temporary URL for the file
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
