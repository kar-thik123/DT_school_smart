import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private isHidden = true;

  @Input() set appHasPermission(permission: string) {
    this.updateView(permission);
  }

  private updateView(permission: string) {
    const hasPermission = this.authService.hasPermission(permission);

    if (hasPermission && this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isHidden = false;
    } else if (!hasPermission && !this.isHidden) {
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }
}
