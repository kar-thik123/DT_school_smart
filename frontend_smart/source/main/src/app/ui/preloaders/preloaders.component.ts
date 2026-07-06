import { GlobalLoaderComponent } from '@shared/components/global-loader/global-loader.component';
import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-preloaders',
    templateUrl: './preloaders.component.html',
    styleUrls: ['./preloaders.component.scss'],
    imports: [GlobalLoaderComponent, BreadcrumbComponent, MatProgressSpinnerModule]
})
export class PreloadersComponent {
  breadscrums = [
    {
      title: 'Preloaders',
      items: ['UI'],
      active: 'Preloaders',
    },
  ];

  constructor() {
    //constructor
  }
}
