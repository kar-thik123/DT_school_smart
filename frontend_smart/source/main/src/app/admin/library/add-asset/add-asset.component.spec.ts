import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddAssetComponent } from './add-asset.component';

describe('AddAssetComponent', () => {
  let component: AddAssetComponent;
  let fixture: ComponentFixture<AddAssetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AddAssetComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
