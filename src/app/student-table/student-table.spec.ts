import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentTable } from './student-table';

describe('StudentTable', () => {
  let component: StudentTable;
  let fixture: ComponentFixture<StudentTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentTable],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
