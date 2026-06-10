import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Event, Router, NavigationStart, NavigationEnd } from '@angular/router';
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
        this.currentUrl = routerEvent.url.substring(
          routerEvent.url.lastIndexOf('/') + 1
        );
      }
      if (routerEvent instanceof NavigationEnd) {
        /* empty */
      }
      window.scrollTo(0, 0);
    });
  }
}
