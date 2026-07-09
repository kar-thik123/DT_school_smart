import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExaminationAnalyticsComponent } from './examination-analytics.component';

describe('ExaminationAnalyticsComponent', () => {
  let component: ExaminationAnalyticsComponent;
  let fixture: ComponentFixture<ExaminationAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExaminationAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExaminationAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
