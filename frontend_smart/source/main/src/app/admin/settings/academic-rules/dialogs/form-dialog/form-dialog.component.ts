import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { AcademicRuleService } from '../../academic-rule.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AcademicRule } from '../../academic-rule.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  academicRule: AcademicRule;
}

@Component({
  selector: 'app-academic-rule-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  imports: [MatButtonModule, MatIconModule, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatInputModule, MatDialogClose],
})
export class AcademicRuleFormComponent {
  dialogRef = inject<MatDialogRef<AcademicRuleFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  academicRuleService = inject(AcademicRuleService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  academicRuleForm: UntypedFormGroup;
  academicRule: AcademicRule;

  constructor() {
    const data = this.data;
    this.action = data.action;
    this.dialogTitle = this.action === 'edit' ? data.academicRule.ruleName : 'New Rule';
    this.academicRule = this.action === 'edit' ? data.academicRule : new AcademicRule({} as AcademicRule);
    this.academicRuleForm = this.createAcademicRuleForm();
  }

  createAcademicRuleForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.academicRule.id],
      ruleName: [this.academicRule.ruleName, [Validators.required]],
      category: [this.academicRule.category, [Validators.required]],
      appliedTo: [this.academicRule.appliedTo, [Validators.required]],
      priority: [this.academicRule.priority, [Validators.required]],
      effectiveDate: [this.academicRule.effectiveDate, [Validators.required]],
      description: [this.academicRule.description, [Validators.required]],
      status: [this.academicRule.status, [Validators.required]],
    });
  }

  getErrorMessage(control: UntypedFormControl): string {
    if (control.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  submit(): void {
    if (this.academicRuleForm.valid) {
      const formData = this.academicRuleForm.getRawValue();
      if (this.action === 'edit') {
        this.academicRuleService.updateRule(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Update Error:', error); },
        });
      } else {
        this.academicRuleService.addRule(formData).subscribe({
          next: (response) => { this.dialogRef.close(response); },
          error: (error) => { console.error('Add Error:', error); },
        });
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  public confirmAdd(): void {
    this.submit();
  }
}
