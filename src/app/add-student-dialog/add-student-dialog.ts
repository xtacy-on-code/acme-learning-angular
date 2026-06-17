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
  selector: 'app-add-student-dialog',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatDatepickerModule, MatButtonModule, MatDialogModule],
  templateUrl: './add-student-dialog.html',
  styleUrl: './add-student-dialog.css',
})

export class AddStudentDialog {
  studentForm: FormGroup;

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<AddStudentDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.studentForm = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      rollno: [this.data?.rollno || '', Validators.required],
      email: [this.data?.email || '', [Validators.required, Validators.email]],
      grade: [this.data?.grade || '', Validators.required],
      phone: [this.data?.phone || '', Validators.required],
      gender: [this.data?.gender || ''],
      bloodGroup: [this.data?.bloodGroup || ''],
      section: [this.data?.section || ''],
      dob: [this.data?.dob || ''],
      address: [this.data?.address || ''],
    })
  };

  handleSubmit() {
    if (this.studentForm.valid) {
      this.dialogRef.close(this.studentForm.value);
    }
  }
}
