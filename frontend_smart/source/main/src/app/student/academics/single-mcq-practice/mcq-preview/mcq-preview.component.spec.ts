import { ComponentFixture, TestBed } from '@angular/core/testing';

import { McqPreviewComponent } from './mcq-preview.component';

describe('McqPreviewComponent', () => {
  let component: McqPreviewComponent;
  let fixture: ComponentFixture<McqPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McqPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(McqPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
