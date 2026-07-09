import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectAnalyticsComponent } from './subject-analytics.component';

describe('SubjectAnalyticsComponent', () => {
  let component: SubjectAnalyticsComponent;
  let fixture: ComponentFixture<SubjectAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
