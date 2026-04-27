import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, inject } from '@angular/core';
import { EmployeeSalaryService } from '../../employee-salary.service';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { EmployeeSalary } from '../../employee-salary.model';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  action: string;
  employeeSalary: EmployeeSalary;
}

@Component({
  selector: 'app-employee-salary-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDialogClose,
  ],
})
export class EmployeeSalaryFormComponent {
  dialogRef = inject<MatDialogRef<EmployeeSalaryFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  employeeSalaryService = inject(EmployeeSalaryService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  employeeSalaryForm: UntypedFormGroup;
  employeeSalary: EmployeeSalary;

  constructor() {
    const data = this.data;

    // Set the defaults
    this.action = data.action;
    this.employeeSalary =
      this.action === 'edit'
        ? data.employeeSalary
        : new EmployeeSalary({} as EmployeeSalary);
    this.dialogTitle =
      this.action === 'edit'
        ? `Edit Salary for ${this.employeeSalary.name}`
        : 'New Employee Salary';
    this.employeeSalaryForm = this.createEmployeeSalaryForm();
    this.subscribeToSalaryChanges();
  }

  // Create the form for Employee Salary
  private createEmployeeSalaryForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.employeeSalary.id],
      img: [this.employeeSalary.img],
      name: [this.employeeSalary.name, Validators.required],
      email: [
        this.employeeSalary.email,
        [Validators.required, Validators.email],
      ],
      payslip: [this.employeeSalary.payslip],
      role: [this.employeeSalary.role, Validators.required],
      empID: [this.employeeSalary.empID, Validators.required],
      department: [this.employeeSalary.department, Validators.required],
      salary: [this.employeeSalary.salary, [Validators.required]],
      bonus: [this.employeeSalary.bonus],
      deductions: [this.employeeSalary.deductions],
      netSalary: [this.employeeSalary.netSalary],
    });
  }

  // Automatically calculate net salary when salary, bonus, or deductions change
  private subscribeToSalaryChanges(): void {
    this.employeeSalaryForm
      .get('salary')
      ?.valueChanges.subscribe(() => this.calculateNetSalary());
    this.employeeSalaryForm
      .get('bonus')
      ?.valueChanges.subscribe(() => this.calculateNetSalary());
    this.employeeSalaryForm
      .get('deductions')
      ?.valueChanges.subscribe(() => this.calculateNetSalary());
  }

  // Calculate net salary
  private calculateNetSalary(): void {
    const salary = this.employeeSalaryForm.get('salary')?.value || 0;
    const bonus = this.employeeSalaryForm.get('bonus')?.value || 0;
    const deductions = this.employeeSalaryForm.get('deductions')?.value || 0;
    const netSalary = salary + bonus - deductions;
    this.employeeSalaryForm.get('netSalary')?.setValue(netSalary);
  }

  // Error message handling for all fields
  getErrorMessage(controlName: string): string {
    const control = this.employeeSalaryForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Not a valid email';
    }
    return '';
  }

  // Form submit logic
  submit(): void {
    if (this.employeeSalaryForm.valid) {
      const salaryData = this.employeeSalaryForm.getRawValue();
      if (this.action === 'edit') {
        this.employeeSalaryService.updateEmployeeSalary(salaryData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Update Error:', error);
            // Optionally show an error message to the user
          },
        });
      } else {
        this.employeeSalaryService.addEmployeeSalary(salaryData).subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Add Error:', error);
            // Optionally show an error message to the user
          },
        });
      }
    }
  }

  // Close the dialog
  onNoClick(): void {
    this.dialogRef.close();
  }
}
