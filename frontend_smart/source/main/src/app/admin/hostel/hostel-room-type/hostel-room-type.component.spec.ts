import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostelRoomTypeComponent } from './hostel-room-type.component';

describe('HostelRoomTypeComponent', () => {
  let component: HostelRoomTypeComponent;
  let fixture: ComponentFixture<HostelRoomTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostelRoomTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostelRoomTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
