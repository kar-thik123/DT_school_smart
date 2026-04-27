import { Component, inject } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatLineModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-bottom-sheet',
    templateUrl: './bottom-sheet.component.html',
    styleUrls: ['./bottom-sheet.component.scss'],
    imports: [BreadcrumbComponent, MatButtonModule, MatBottomSheetModule]
})
export class BottomSheetComponent {
  private _bottomSheet = inject(MatBottomSheet);

  breadscrums = [
    {
      title: 'Bottom Sheed',
      items: ['UI'],
      active: 'Bottom Sheet',
    },
  ];
  openBottomSheet(): void {
    this._bottomSheet.open(BottomSheetOverviewExampleSheetComponent);
  }
}
@Component({
    selector: 'app-bottom-sheet-overview-example-sheet',
    templateUrl: 'bottom-sheet-overview-example-sheet.html',
    imports: [MatListModule, MatLineModule]
})
export class BottomSheetOverviewExampleSheetComponent {
  private _bottomSheetRef = inject<MatBottomSheetRef<BottomSheetOverviewExampleSheetComponent>>(MatBottomSheetRef);

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }
}
