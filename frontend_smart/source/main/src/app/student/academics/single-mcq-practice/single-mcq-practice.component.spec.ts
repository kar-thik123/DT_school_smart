import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleMcqPracticeComponent } from './single-mcq-practice.component';

describe('SingleMcqPracticeComponent', () => {
  let component: SingleMcqPracticeComponent;
  let fixture: ComponentFixture<SingleMcqPracticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleMcqPracticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleMcqPracticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
