import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { Component, inject, OnInit } from '@angular/core';
import { UserManagementService } from '../../user-management.service';
import { UntypedFormControl, Validators, UntypedFormGroup, UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User, IUser } from '../../user-management.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { RolePermissionService } from '../../../role-permissions/role-permission.service';
import { IRole } from '../../../role-permissions/role-permission.model';
import { lastValueFrom } from 'rxjs';

export interface DialogData {
  id: string;
  action: 'add' | 'edit';
  userManagement: IUser;
}

@Component({
  selector: 'app-user-management-form',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  standalone: true,
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
    CommonModule
  ],
})
export class UserManagementFormComponent implements OnInit {
  dialogRef = inject<MatDialogRef<UserManagementFormComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  userManagementService = inject(UserManagementService);
  roleService = inject(RolePermissionService);
  private fb = inject(UntypedFormBuilder);

  action: string;
  dialogTitle: string;
  userForm!: UntypedFormGroup;
  user: IUser;
  
  roles: IRole[] = [];
  isLoading = true;

  constructor() {
    this.action = this.data.action;
    this.user = this.action === 'edit' ? this.data.userManagement : new User({} as IUser);
    this.dialogTitle = this.action === 'edit' ? `Edit User: ${this.user.name}` : 'New User Account';
  }

  ngOnInit() {
    this.initForm();
    this.loadRoles();
  }

  async loadRoles() {
    try {
      this.roles = await lastValueFrom(this.roleService.getAllRoles());
      this.isLoading = false;
    } catch (error: any) {
      console.error('Failed to load roles', error);
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      id: [this.user.id],
      name: [this.user.name, [Validators.required, Validators.minLength(3)]],
      email: [this.user.email, [Validators.required, Validators.email]],
      password: ['', this.action === 'add' ? [Validators.required, Validators.minLength(6)] : []],
      role_id: [this.user.role_id, [Validators.required]],
      roll_number: [this.user.roll_number],
      is_active: [this.user.is_active ?? true]
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.hasError('required')) return 'This field is required';
    if (control?.hasError('email')) return 'Not a valid email';
    if (control?.hasError('minlength')) return 'Too short';
    return '';
  }

  submit(): void {
    if (this.userForm.invalid) return;
    
    const formData = this.userForm.getRawValue();
    const obs = this.action === 'edit' 
      ? this.userManagementService.updateUser(formData.id, formData)
      : this.userManagementService.addUser(formData);

    obs.subscribe({
      next: (response) => this.dialogRef.close(response),
      error: (error: any) => {
        // Handle license limit or other errors
        alert(error.message || 'Operation failed');
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
