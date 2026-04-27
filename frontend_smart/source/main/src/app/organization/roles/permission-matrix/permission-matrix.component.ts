import { Component, Input, OnInit, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../role.service';
import { Permission } from '../../role.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatTableModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './permission-matrix.component.html',
  styleUrls: ['./permission-matrix.component.scss']
})
export class PermissionMatrixComponent implements OnInit, OnChanges {
  @Input() roleId: string | null | undefined = null;
  @Input() isReadOnly = false;

  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  availablePermissions: Permission[] = [];
  activePermissionIds: Set<string> = new Set();
  modules: string[] = [];
  actions: string[] = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE']; // Typical actions

  isSaving = false;

  ngOnInit() {
    this.roleService.getAvailablePermissions().subscribe(res => {
      this.availablePermissions = res;
      this.modules = [...new Set(res.map(p => p.module))];
    });
  }

  ngOnChanges() {
    if (this.roleId) {
      this.loadRolePermissions();
    } else {
      this.activePermissionIds.clear();
    }
  }

  loadRolePermissions() {
    if (!this.roleId) return;
    this.roleService.getRolePermissions(this.roleId).subscribe(res => {
      this.activePermissionIds = new Set(res.map(p => p.id));
    });
  }

  hasPermission(module: string, action: string): boolean {
    const p = this.findPermission(module, action);
    return p ? this.activePermissionIds.has(p.id) : false;
  }

  isPermissionDisabled(module: string, action: string): boolean {
    if (this.isReadOnly) return true;
    return !this.findPermission(module, action);
  }

  togglePermission(module: string, action: string) {
    if (this.isReadOnly) return;
    const p = this.findPermission(module, action);
    if (!p) return;

    if (this.activePermissionIds.has(p.id)) {
      this.activePermissionIds.delete(p.id);
    } else {
      this.activePermissionIds.add(p.id);
    }
  }

  private findPermission(module: string, action: string) {
    return this.availablePermissions.find(p => p.module === module && p.action === action);
  }

  savePermissions() {
    if (!this.roleId || this.isReadOnly) return;
    this.isSaving = true;
    this.roleService.syncPermissions(this.roleId, Array.from(this.activePermissionIds)).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Capabilities synchronized successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Failed to sync capabilities', 'Close', { duration: 3000 });
      }
    });
  }
}
