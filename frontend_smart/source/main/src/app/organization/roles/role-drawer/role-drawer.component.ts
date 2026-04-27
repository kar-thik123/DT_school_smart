import { Component, Input, Output, EventEmitter, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Role, Permission } from '../../role.model';
import { RoleService } from '../../role.service';
import { PermissionMatrixComponent } from '../permission-matrix/permission-matrix.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-role-drawer',
  standalone: true,
  imports: [
    CommonModule, 
    MatTabsModule, 
    MatIconModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule,
    MatSnackBarModule,
    PermissionMatrixComponent
  ],
  templateUrl: './role-drawer.component.html',
  styleUrls: ['./role-drawer.component.scss']
})
export class RoleDrawerComponent implements OnChanges {
  @Input() role: Role | null = null;
  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnChanges() {
    if (this.role) {
      this.roleForm.patchValue({
        name: this.role.name,
        description: this.role.description
      });
    } else {
      this.roleForm.reset();
    }
  }

  saveRole() {
    if (this.roleForm.invalid) return;
    
    if (this.role) {
      // Logic for updating metadata
      this.onSave.emit();
    } else {
      this.roleService.createRole(this.roleForm.value).subscribe(() => {
        this.snackBar.open('Role created successfully', 'Close', { duration: 3000 });
        this.onSave.emit();
      });
    }
  }
}
