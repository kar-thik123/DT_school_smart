import {
  Router,
  NavigationEnd,
  RouterLinkActive,
  RouterLink,
} from '@angular/router';
import { NgClass } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2, HostListener, DOCUMENT, inject } from '@angular/core';
import { AuthService } from '@core';
import { RouteInfo } from './sidebar.metadata';
import { TranslateModule } from '@ngx-translate/core';
import { NgScrollbar } from 'ngx-scrollbar';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { SidebarService } from './sidebar.service';
import { NgxPermissionsModule } from 'ngx-permissions';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    NgScrollbar,
    RouterLinkActive,
    RouterLink,
    NgClass,
    TranslateModule,
    NgxPermissionsModule,
  ],
})
export class SidebarComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit {
  private document = inject<Document>(DOCUMENT);
  private renderer = inject(Renderer2);
  elementRef = inject(ElementRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private http = inject(HttpClient);

  public sidebarItems!: RouteInfo[];
  public innerHeight?: number;
  public bodyTag!: HTMLElement;
  listMaxHeight?: string;
  listMaxWidth?: string;
  userFullName?: string;
  userImg?: string;
  userType?: string;
  headerHeight = 60;
  currentRoute?: string;
  constructor() {
    super();
    this.elementRef.nativeElement.closest('body');
    this.subs.sink = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // close sidebar on mobile screen after menu select
        this.renderer.removeClass(this.document.body, 'overlay-open');
      }
    });
  }
  @HostListener('window:resize', ['$event'])
  windowResizecall(_event?: Event) {
    this.setMenuHeight();
    this.checkStatuForResize(false);
  }
  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.renderer.removeClass(this.document.body, 'overlay-open');
    }
  }
  callToggleMenu(event: Event, length: number) {
    if (length > 0) {
      const parentElement = (event.target as HTMLInputElement).closest('li');
      const activeClass = parentElement?.classList.contains('active');

      if (activeClass) {
        this.renderer.removeClass(parentElement, 'active');
      } else {
        this.renderer.addClass(parentElement, 'active');
      }
    }
  }
  ngOnInit() {
    if (this.authService.currentUserValue) {
      this.userFullName = this.authService.currentUserValue.name;
      this.userImg =
        './assets/images/user/' + this.authService.currentUserValue.avatar;

      this.fetchProfileImage();

      this.subs.sink = this.sidebarService
        .getRouteInfo()
        .subscribe((routes: RouteInfo[]) => {
          const userPermissions = this.authService.getPermissions();
          console.log('User Permissions', userPermissions);
          console.log('All Sidebar Menus', routes);

          const filteredRoutes = this.filterRoutes(routes);
          console.log('Filtered Menus', filteredRoutes);

          this.sidebarItems = this.adjustPathsForUser(filteredRoutes);
        });

      if (this.authService.hasPermission('IDENTITY', 'IS_SUPER_ADMIN')) {
        this.userType = 'Super Admin';
      } else if (this.authService.hasPermission('IDENTITY', 'IS_MANAGEMENT')) {
        this.userType = 'Management';
      } else if (this.authService.hasPermission('IDENTITY', 'IS_TEACHER')) {
        this.userType = 'Teacher';
      } else if (this.authService.hasPermission('IDENTITY', 'IS_STUDENT')) {
        this.userType = 'Student';
      } else if (this.authService.hasPermission('IDENTITY', 'IS_SYSTEM_ADMIN')) {
        this.userType = 'System Admin';
      } else {
        this.userType = 'User';
      }
    }

    this.initLeftSidebar();
    this.bodyTag = this.document.body;
  }
  initLeftSidebar() {
    // Set menu height
    this.setMenuHeight();
    this.checkStatuForResize(true);
  }
  setMenuHeight() {
    this.innerHeight = window.innerHeight;
    const height = this.innerHeight - this.headerHeight;
    this.listMaxHeight = height + '';
    this.listMaxWidth = '500px';
  }
  isOpen() {
    return this.bodyTag.classList.contains('overlay-open');
  }
  checkStatuForResize(_firstTime: boolean) {
    if (window.innerWidth < 1025) {
      this.renderer.addClass(this.document.body, 'ls-closed');
    } else {
      this.renderer.removeClass(this.document.body, 'ls-closed');
    }
  }
  mouseHover() {
    const body = this.elementRef.nativeElement.closest('body');
    if (body.classList.contains('submenu-closed')) {
      this.renderer.addClass(this.document.body, 'side-closed-hover');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
    }
  }
  mouseOut() {
    const body = this.elementRef.nativeElement.closest('body');
    if (body.classList.contains('side-closed-hover')) {
      this.renderer.removeClass(this.document.body, 'side-closed-hover');
      this.renderer.addClass(this.document.body, 'submenu-closed');
    }
  }
  logout() {
    this.subs.sink = this.authService.logout().subscribe((res) => {
      if (res.success) {
        this.router.navigate(['/authentication/signin']);
      }
    });
  }

  capitalizeString(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  fetchProfileImage(): void {
    const currentUser = this.authService.currentUserValue;

    if (currentUser?.id) {
      this.http.get<any>(`${environment.apiUrl}/users/profile/${currentUser.id}`)
        .subscribe({
          next: (data) => {
            if (data.profile_image) {
              const baseUrl = environment.apiUrl.replace('/api', '');
              this.userImg = `${baseUrl}${data.profile_image.startsWith('/') ? '' : '/'}${data.profile_image}`;
            }
          },
          error: (err) => {
            console.error('Failed to fetch profile image:', err);
          }
        });
    }
  }

  adjustPathsForUser(routes: RouteInfo[]): RouteInfo[] {
    const userRole = this.authService.getRole() || '';
    const userRoleUpper = userRole.toUpperCase();

    if (userRoleUpper !== 'TEACHER') {
      return routes;
    }

    return routes.map(item => {
      const newItem = { ...item };

      // Rewrite routes for Teacher role context
      if (newItem.path === '/admin/administration/question-bank') {
        newItem.path = '/teacher/question-bank';
      } else if (newItem.path === '/admin/administration/completion-mgmt') {
        newItem.path = '/teacher/completion';
      }

      if (newItem.submenu && newItem.submenu.length > 0) {
        newItem.submenu = this.adjustPathsForUser(newItem.submenu);
      }

      return newItem;
    });
  }

  filterRoutes(routes: RouteInfo[]): RouteInfo[] {
    const filtered: RouteInfo[] = [];

    for (const item of routes) {
      const newItem = { ...item };

      // Support showInSidebar flag
      if (newItem.showInSidebar === false) {
        continue;
      }

      // Check if user has access to the main item
      if (!this.hasAccess(newItem)) {
        continue;
      }

      // If it has submenus, filter them recursively
      if (newItem.submenu && newItem.submenu.length > 0) {
        newItem.submenu = this.filterRoutes(newItem.submenu);

        // Hide parent if it's a menu-toggle and all submenus were filtered out
        if (newItem.submenu.length === 0 && newItem.class === 'menu-toggle') {
          continue;
        }
      }

      filtered.push(newItem);
    }

    return filtered;
  }

  hasAccess(item: RouteInfo): boolean {
    const userRole = this.authService.getRole() || '';
    const userRoleUpper = userRole.toUpperCase();

    // 1. Enforce Domain Segregation
    if (item.domain === 'PLATFORM') {
      if (userRoleUpper !== 'SYSTEM_ADMIN') {
        return false;
      }
    }
    
    if (item.domain === 'TENANT') {
      if (userRoleUpper === 'SYSTEM_ADMIN') {
        return false;
      }
    }

    // Handle group header "Administration"
    if (item.title === 'MENUITEMS.ADMINISTRATION.TEXT') {
      // Allow if user has access to at least one submenu
      if (item.submenu && item.submenu.length > 0) {
        return item.submenu.some(sub => this.hasAccess(sub));
      }
    }

    const rolesOrPermissions = item.role;
    if (!rolesOrPermissions || rolesOrPermissions.length === 0 || (rolesOrPermissions.length === 1 && rolesOrPermissions[0] === '')) {
      if (item.path) {
        return this.hasPathAccess(item.path);
      }
      return true;
    }

    const hasRoleOrPerm = rolesOrPermissions.some(roleOrPerm => {
      // Match role
      if (roleOrPerm === userRole || roleOrPerm === userRoleUpper) {
        return true;
      }
      // Match permission
      const isRoleName = ['TEACHER', 'STUDENT', 'SYSTEM_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'].includes(roleOrPerm.toUpperCase());
      if (!isRoleName && this.authService.hasPermission(roleOrPerm)) {
        return true;
      }
      return false;
    });

    if (hasRoleOrPerm) {
      if (item.path) {
        return this.hasPathAccess(item.path);
      }
      return true;
    }

    return false;
  }

  hasPathAccess(path: string): boolean {
    const userRole = this.authService.getRole() || '';
    const userRoleUpper = userRole.toUpperCase();

    // Strict platform domain segregation at the path level
    if (path.includes('/organization/')) {
      return userRoleUpper === 'SYSTEM_ADMIN';
    }

    // Map critical routes to their corresponding permissions FIRST
    if (path.includes('/question-bank')) {
      return this.authService.hasPermission('QUESTION_BANK', 'VIEW') ||
        this.authService.hasPermission('QUESTION_BANK_VIEW');
    }
    if (path.includes('/completion') || path.includes('/completion-mgmt')) {
      return this.authService.hasPermission('COMPLETION_TRACKING', 'VIEW') ||
        this.authService.hasPermission('COMPLETION_TRACKING_VIEW') ||
        this.authService.hasPermission('COMPLETION', 'VIEW') ||
        this.authService.hasPermission('COMPLETION_VIEW');
    }
    if (path.includes('/skills-verify-assignment')) {
      return this.authService.hasPermission('SKILLS_VERIFY_ASSIGNMENT', 'VIEW') ||
        this.authService.hasPermission('SKILLS_VERIFY_ASSIGNMENT_VIEW') ||
        userRoleUpper === 'SUPER_ADMIN';
    }
    if (path.includes('/skills-verify')) {
      return this.authService.hasPermission('IDENTITY', 'IS_SKILL_VERIFIER') ||
        this.authService.hasPermission('IDENTITY_IS_SKILL_VERIFIER') ||
        userRoleUpper === 'SUPER_ADMIN';
    }
    if (path.includes('/teacher-assignment')) {
      return this.authService.hasPermission('TEACHER_ASSIGNMENT', 'VIEW') ||
        this.authService.hasPermission('TEACHER_ASSIGNMENT_VIEW');
    }
    if (path.includes('/units-list')) {
      return this.authService.hasPermission('UNITS_LIST', 'MANAGE_SYLLABUS') ||
        this.authService.hasPermission('ACADEMIC', 'MANAGE_SYLLABUS');
    }
    if (path.includes('/academic-structure')) {
      return this.authService.hasPermission('ACADEMIC_STRUCTURE', 'READ') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE_READ') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE', 'VIEW') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE_VIEW');
    }
    if (path.includes('/users')) {
      return this.authService.hasPermission('USERS', 'VIEW') ||
        this.authService.hasPermission('USERS_VIEW');
    }
    if (path.includes('/roles')) {
      return this.authService.hasPermission('ROLES_AND_PERMISSIONS', 'VIEW') ||
        this.authService.hasPermission('ROLES_AND_PERMISSIONS_VIEW');
    }
    if (path.includes('/master-config')) {
      return this.authService.hasPermission('MASTER_CONFIGURATION', 'VIEW') ||
        this.authService.hasPermission('ORGANIZATION', 'MANAGE_CONFIG') ||
        this.authService.hasPermission('ORGANIZATION_MANAGE_CONFIG');
    }
    if (path.includes('/student-mapping')) {
      return this.authService.hasPermission('STUDENT_ENROLLMENT', 'READ') ||
        this.authService.hasPermission('STUDENT_ENROLLMENT', 'VIEW') ||
        this.authService.hasPermission('STUDENT_ENROLLMENT_VIEW') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE', 'READ') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE_READ') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE', 'VIEW') ||
        this.authService.hasPermission('ACADEMIC_STRUCTURE_VIEW');
    }
    if (path.includes('/analytics')) {
      return this.authService.hasPermission('ANALYTICS', 'VIEW_OWN') ||
        this.authService.hasPermission('ANALYTICS_VIEW_OWN') ||
        this.authService.hasPermission('ANALYTICS', 'VIEW_SCHOOL') ||
        this.authService.hasPermission('ANALYTICS_VIEW_SCHOOL');
    }
    if (path.includes('/practice')) {
      return this.authService.hasPermission('PRACTICE', 'VIEW_OWN') ||
        this.authService.hasPermission('PRACTICE_VIEW_OWN');
    }
    if (path.includes('/mcq')) {
      return this.authService.hasPermission('MCQ', 'VIEW') ||
        this.authService.hasPermission('MCQ_VIEW');
    }
    if (path.includes('/settings')) {
      return this.authService.hasPermission('MASTER_CONFIGURATION', 'VIEW') ||
        this.authService.hasPermission('MASTER_CONFIGURATION_VIEW');
    }

    // Default legacy namespace fallback for other path patterns
    if (path.startsWith('/teacher/')) {
      return userRoleUpper === 'TEACHER';
    }
    if (path.startsWith('/student/')) {
      return userRoleUpper === 'STUDENT';
    }
    if (path.startsWith('/admin/')) {
      return ['ADMIN', 'SUPER_ADMIN', 'MANAGEMENT'].includes(userRoleUpper);
    }

    return true;
  }
}

