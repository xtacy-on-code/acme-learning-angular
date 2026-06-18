import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentDialog } from './add-student-dialog';

describe('AddStudentDialog', () => {
  let component: AddStudentDialog;
  let fixture: ComponentFixture<AddStudentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStudentDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AddStudentDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
