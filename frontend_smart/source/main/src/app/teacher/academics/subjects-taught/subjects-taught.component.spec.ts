import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectsTaughtComponent } from './subjects-taught.component';

describe('SubjectsTaughtComponent', () => {
  let component: SubjectsTaughtComponent;
  let fixture: ComponentFixture<SubjectsTaughtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubjectsTaughtComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectsTaughtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});