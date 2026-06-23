import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-add-professor-dialog',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatDatepickerModule, MatButtonModule, MatDialogModule],
  templateUrl: './add-professor-dialog.html',
  styleUrl: './add-professor-dialog.css',
})

export class AddProfessorDialog {
  professorForm: FormGroup;

  readonly designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<AddProfessorDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.professorForm = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      employeeId: [this.data?.employeeId || '', Validators.required],
      email: [this.data?.email || '', Validators.email],
      department: [this.data?.department || ''],
      designation: [this.data?.designation || '', Validators.required],
      phone: [this.data?.phone || ''],
      gender: [this.data?.gender || '', Validators.required],
      specialization: [this.data?.specialization || ''],
      experience: [this.data?.experience ?? ''],
      joiningDate: [this.data?.joiningDate || ''],
    })
  };

  handleSubmit() {
    if (this.professorForm.valid) {
      this.dialogRef.close(this.professorForm.value);
    }
  }
}
