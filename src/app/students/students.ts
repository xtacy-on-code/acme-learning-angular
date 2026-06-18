import { Component, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddStudentDialog } from '../add-student-dialog/add-student-dialog';
import { MatButtonModule } from '@angular/material/button';
import { DataTable } from "../data-table/data-table";
import { StudentStore } from '../student-store';


@Component({
  selector: 'app-students',
  imports: [MatButtonModule, DataTable],
  templateUrl: './students.html',
  styleUrl: './students.css',
})


export class Students{
  columns = [
  { key: 'name', label: 'Name' },
  { key: 'rollno', label: 'Roll No' },
  { key: 'email', label: 'Email' },
  { key: 'grade', label: 'Grade' },
  { key: 'phone', label: 'Phone' },
  { key: 'gender', label: 'Gender' }
];

  constructor(private dialog: MatDialog, public studentStore: StudentStore) {
    this.studentStore.loadStudents();
  }

  openAddStudentDialog() {
    const dialogRef = this.dialog.open(AddStudentDialog);

    dialogRef.afterClosed().subscribe((result) => {
      console.log('dialog closed, result:', result);
      if (result) {
        this.studentStore.addStudent(result);
      }
    });
  }

    editStudent(student: any) {
    const dialogRef = this.dialog.open(AddStudentDialog, { data: student });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.studentStore.updateStudent(student._id, result);
      }
    });
  }

  deleteStudent(student: any) {
    this.studentStore.deleteStudent(student);
  }

  
}
