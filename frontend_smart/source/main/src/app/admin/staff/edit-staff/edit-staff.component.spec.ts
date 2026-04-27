import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EditStaffComponent } from './edit-staff.component';
describe('EditStaffComponent', () => {
  let component: EditStaffComponent;
  let fixture: ComponentFixture<EditStaffComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditStaffComponent]
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(EditStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
