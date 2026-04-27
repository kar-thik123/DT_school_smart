import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionInquiryComponent } from './admission-inquiry.component';

describe('AdmissionInquiryComponent', () => {
  let component: AdmissionInquiryComponent;
  let fixture: ComponentFixture<AdmissionInquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmissionInquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmissionInquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
