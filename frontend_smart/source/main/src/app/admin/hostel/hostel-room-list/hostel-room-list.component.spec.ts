import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostelRoomListComponent } from './hostel-room-list.component';

describe('HostelRoomListComponent', () => {
  let component: HostelRoomListComponent;
  let fixture: ComponentFixture<HostelRoomListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostelRoomListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostelRoomListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
