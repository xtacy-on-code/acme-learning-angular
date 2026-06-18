import { TestBed } from '@angular/core/testing';

import { StudentStore } from './student-store';

describe('StudentStore', () => {
  let service: StudentStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
