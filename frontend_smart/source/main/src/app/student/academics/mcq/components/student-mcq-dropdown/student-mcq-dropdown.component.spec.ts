import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentMcqDropdownComponent } from './student-mcq-dropdown.component';

describe('StudentMcqDropdownComponent', () => {
  let component: StudentMcqDropdownComponent;
  let fixture: ComponentFixture<StudentMcqDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentMcqDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentMcqDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
