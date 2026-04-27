import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../role.service';
import { Role } from '../role.model';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { RoleDrawerComponent } from './role-drawer/role-drawer.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatIconModule, 
    MatButtonModule, 
    MatChipsModule, 
    MatMenuModule,
    MatSidenavModule,
    BreadcrumbComponent,
    RoleDrawerComponent
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  
  roles: Role[] = [];
  displayedColumns: string[] = ['name', 'description', 'users', 'status', 'actions'];
  
  @ViewChild('drawer') drawer!: MatSidenav;
  selectedRole: Role | null = null;

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(res => this.roles = res);
  }

  openDrawer(role: Role | null = null) {
    this.selectedRole = role;
    this.drawer.open();
  }

  onRoleSaved() {
    this.drawer.close();
    this.loadRoles();
  }
}
