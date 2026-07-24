import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Event, Router, NavigationStart, NavigationEnd, RoutesRecognized, GuardsCheckStart, GuardsCheckEnd, ResolveStart, ResolveEnd, NavigationCancel, NavigationError } from '@angular/router';
import { PageLoaderComponent } from './layout/page-loader/page-loader.component';
import { GlobalLoaderComponent } from './shared/components/global-loader/global-loader.component';
@Component({
    selector: 'app-root',
    imports: [RouterModule, PageLoaderComponent, GlobalLoaderComponent],
    providers: [],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  _router = inject(Router);

  currentUrl!: string;
  constructor() {
    this._router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        console.log('[DEBUG-ROUTER] NavigationStart URL:', routerEvent.url);
        this.currentUrl = routerEvent.url.substring(
          routerEvent.url.lastIndexOf('/') + 1
        );
      } else if (routerEvent instanceof RoutesRecognized) {
        console.log('[DEBUG-ROUTER] RoutesRecognized:', routerEvent);
      } else if (routerEvent instanceof GuardsCheckStart) {
        console.log('[DEBUG-ROUTER] GuardsCheckStart:', routerEvent);
      } else if (routerEvent instanceof GuardsCheckEnd) {
        console.log('[DEBUG-ROUTER] GuardsCheckEnd:', routerEvent);
      } else if (routerEvent instanceof ResolveStart) {
        console.log('[DEBUG-ROUTER] ResolveStart:', routerEvent);
      } else if (routerEvent instanceof ResolveEnd) {
        console.log('[DEBUG-ROUTER] ResolveEnd:', routerEvent);
      } else if (routerEvent instanceof NavigationEnd) {
        console.log('[DEBUG-ROUTER] NavigationEnd URL:', routerEvent.url);
        window.scrollTo(0, 0);
      } else if (routerEvent instanceof NavigationCancel) {
        console.log('[DEBUG-ROUTER] NavigationCancel! Reason:', routerEvent.reason);
      } else if (routerEvent instanceof NavigationError) {
        console.error('[DEBUG-ROUTER] NavigationError! Error:', routerEvent.error, '\nStack:', routerEvent.error?.stack);
      }
    });
  }
}
