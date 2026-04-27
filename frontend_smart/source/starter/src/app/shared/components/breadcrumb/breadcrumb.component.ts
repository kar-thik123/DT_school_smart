import { Component, input } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    imports: [RouterLink, FeatherModule]
})
export class BreadcrumbComponent {
  readonly title = input.required<string>();
  readonly items = input.required<string[]>();
  readonly active_item = input.required<string>();

  constructor() {
    //constructor
  }
}
