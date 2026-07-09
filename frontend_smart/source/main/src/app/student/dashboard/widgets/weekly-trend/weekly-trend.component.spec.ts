import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTrendComponent } from './weekly-trend.component';

describe('WeeklyTrendComponent', () => {
  let component: WeeklyTrendComponent;
  let fixture: ComponentFixture<WeeklyTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyTrendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
