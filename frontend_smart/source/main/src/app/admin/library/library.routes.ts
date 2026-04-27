import { Route } from '@angular/router';
import { AllAssetsComponent } from './all-assets/all-assets.component';
import { AddAssetComponent } from './add-asset/add-asset.component';
import { EditAssetComponent } from './edit-asset/edit-asset.component';
import { Page404Component } from 'app/authentication/page404/page404.component';
import { BookStatusComponent } from './book-status/book-status.component';
import { IssueReturnComponent } from './issue-return/issue-return.component';
import { LibraryReportsComponent } from './library-reports/library-reports.component';

export const LIBRARY_ROUTE: Route[] = [
  {
    path: 'all-assets',
    component: AllAssetsComponent,
  },
  {
    path: 'add-asset',
    component: AddAssetComponent,
  },
  {
    path: 'edit-asset',
    component: EditAssetComponent,
  },
  {
    path: 'book-status',
    component: BookStatusComponent,
  },
  {
    path: 'issue-return',
    component: IssueReturnComponent,
  },
  {
    path: 'library-reports',
    component: LibraryReportsComponent,
  },
  { path: '**', component: Page404Component },
];
