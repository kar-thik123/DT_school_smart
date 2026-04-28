import { TestBed } from '@angular/core/testing';

import { TeacherAssignmentService } from './teacher-assignment.service';

describe('TeacherAssignmentService', () => {
  let service: TeacherAssignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeacherAssignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
