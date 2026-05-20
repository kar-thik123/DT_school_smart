import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionBankPreviewComponent } from './question-bank-preview.component';

describe('QuestionBankPreviewComponent', () => {
  let component: QuestionBankPreviewComponent;
  let fixture: ComponentFixture<QuestionBankPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionBankPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionBankPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
