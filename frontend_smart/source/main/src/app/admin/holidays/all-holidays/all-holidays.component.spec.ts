import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AllHolidaysComponent } from './all-holidays.component';

describe('AllHolidaysComponent', () => {
  let component: AllHolidaysComponent;
  let fixture: ComponentFixture<AllHolidaysComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AllHolidaysComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllHolidaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
