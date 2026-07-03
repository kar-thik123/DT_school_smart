import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { RolePermissionService } from './role-permission.service';
import { IRole, IPermission, PermissionGroup } from './role-permission.model';
import { CENTRAL_PERMISSION_REGISTRY } from './permission-registry';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-role-permissions',
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTableModule,
    MatTabsModule,
    MatListModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatMenuModule,
    MatSlideToggleModule,
    RouterModule
  ],
})
export class RolePermissionsComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);
  private roleService = inject(RolePermissionService);
  private snackBar = inject(MatSnackBar);

  // Data
  systemRoles: IRole[] = [];
  customRoles: IRole[] = [];
  selectedRole?: IRole;
  
  // Permissions Matrix
  allPermissions: IPermission[] = [];
  permissionGroups: PermissionGroup[] = [];
  
  // Forms
  roleForm!: UntypedFormGroup;
  
  // UI State
  isLoading = true;
  isSaving = false;
  showDrawer = false;
  drawerAction: 'add' | 'edit' | 'clone' = 'add';

  breadscrums = [
    { title: 'Roles & Permissions', items: ['Administration'], active: 'Roles & Permissions' }
  ];

  ngOnInit() {
    this.initForm();
    this.loadInitialData();
  }

  initForm(role?: IRole) {
    this.roleForm = this.fb.group({
      id: [role?.id || ''],
      name: [role?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [role?.description || '']
    });
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      // 1. Load Available Permissions and filter by active registry
      const dbPermissions = await lastValueFrom(this.roleService.getAvailablePermissions()) || [];
      const registryModules = new Set(CENTRAL_PERMISSION_REGISTRY.map(r => r.module));
      this.allPermissions = dbPermissions.filter(p => registryModules.has(p.module));
      
      // 2. Load Roles
      await this.loadRoles();
      
      this.isLoading = false;
    } catch (error) {
      this.showNotification('error', 'Failed to load data');
      this.isLoading = false;
    }
  }

  loadRoles() {
    return new Promise<void>((resolve, reject) => {
      this.roleService.getAllRoles().subscribe({
        next: (roles) => {
          this.systemRoles = roles.filter(r => r.is_system);
          this.customRoles = roles.filter(r => !r.is_system);
          
          if (!this.selectedRole && roles.length > 0) {
            this.selectRole(roles[0]);
          } else if (this.selectedRole) {
            // Refresh selected role reference
            const updated = roles.find(r => r.id === this.selectedRole?.id);
            if (updated) this.selectedRole = updated;
          }
          resolve();
        },
        error: (err: any) => reject(err)
      });
    });
  }

  async selectRole(role: IRole) {
    this.selectedRole = role;
    this.isLoading = true;
    
    try {
      // Load active permissions for this role
      const response = await lastValueFrom(this.roleService.getRolePermissions(role.id)) || [];
      console.log('Permissions Loaded', response);
      const activeIds = new Set(response.map(p => p.id));
      
      // Group permissions and mark selected
      this.buildPermissionMatrix(activeIds);
      
      this.isLoading = false;
    } catch (error) {
      this.showNotification('error', 'Failed to load role permissions');
      this.isLoading = false;
    }
  }

  buildPermissionMatrix(activeIds: Set<string>) {
    this.permissionGroups = CENTRAL_PERMISSION_REGISTRY.map(registryGroup => {
      const actions = this.allPermissions
        .filter(p => p.module === registryGroup.module)
        .map(p => ({
          id: p.id,
          action: p.action,
          selected: activeIds.has(p.id)
        }));
        
      return {
        module: registryGroup.module,
        actions
      };
    }).filter(group => group.actions.length > 0);
  }

  toggleModule(group: PermissionGroup, checked: boolean) {
    
    if (this.selectedRole?.name === 'SUPER_ADMIN') return; group.actions.forEach(a => a.selected = checked);
  }

  isModuleAllSelected(group: PermissionGroup): boolean {
    return group.actions.every(a => a.selected);
  }

  isModulePartialSelected(group: PermissionGroup): boolean {
    const selectedCount = group.actions.filter(a => a.selected).length;
    return selectedCount > 0 && selectedCount < group.actions.length;
  }

  async syncPermissions() {
    if (!this.selectedRole || this.selectedRole.name === 'SUPER_ADMIN') return;
    
    this.isSaving = true;
    const selectedIds = this.permissionGroups
      .flatMap(g => g.actions)
      .filter(a => a.selected)
      .map(a => a.id);
      
    const payload = selectedIds;
    console.log('Saving Permissions Payload', payload);
      
    this.roleService.syncPermissions(this.selectedRole.id, selectedIds).subscribe({
      next: () => {
        this.showNotification('success', 'Permissions updated successfully');
        this.isSaving = false;
        this.loadRoles(); // Refresh counts
      },
      error: (err: any) => {
        this.showNotification('error', err.message || 'Failed to sync permissions');
        this.isSaving = false;
      }
    });
  }

  // --- Role Metadata CRUD ---

  openAddRole() {
    this.drawerAction = 'add';
    this.initForm();
    this.showDrawer = true;
  }

  openEditRole(role: IRole) {
    this.drawerAction = 'edit';
    this.initForm(role);
    this.showDrawer = true;
  }

  openCloneRole(role: IRole) {
    this.drawerAction = 'clone';
    this.initForm({ ...role, name: `${role.name} (Copy)` });
    this.showDrawer = true;
  }

  async saveRole() {
    if (this.roleForm.invalid) return;
    
    this.isSaving = true;
    const formData = this.roleForm.value;
    
    let obs;
    if (this.drawerAction === 'add') {
      obs = this.roleService.addRole(formData);
    } else if (this.drawerAction === 'edit') {
      obs = this.roleService.updateRole(formData.id, formData);
    } else {
      obs = this.roleService.cloneRole(this.selectedRole?.id!, formData);
    }

    obs.subscribe({
      next: (res) => {
        this.showNotification('success', `Role ${this.drawerAction === 'add' ? 'created' : 'updated'} successfully`);
        this.showDrawer = false;
        this.loadRoles();
        this.isSaving = false;
        if (this.drawerAction === 'add' || this.drawerAction === 'clone') {
          this.selectRole(res);
        }
      },
      error: (err: any) => {
        this.showNotification('error', err.message || 'Failed to save role');
        this.isSaving = false;
      }
    });
  }

  deleteRole(role: IRole) {
    if (role.is_system) return;
    
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.showNotification('success', 'Role deleted successfully');
          if (this.selectedRole?.id === role.id) {
            this.selectedRole = undefined;
          }
          this.loadRoles();
        },
        error: (err: any) => {
          this.showNotification('error', err.message || 'Failed to delete role');
        }
      });
    }
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
    });
  }
}
