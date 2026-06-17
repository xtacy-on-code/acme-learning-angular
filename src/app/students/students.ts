import { Component, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddStudentDialog } from '../add-student-dialog/add-student-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';


@Component({
  selector: 'app-students',
  imports: [MatButtonModule, MatTableModule],
  templateUrl: './students.html',
  styleUrl: './students.css',
})


export class Students{
  constructor(private dialog: MatDialog) {
    this.students.set(JSON.parse(localStorage.getItem('students()') || '[]'));
  }

  students = signal<any[]>([]);
  displayedColumns: string[] = ['name', 'rollno', 'email', 'grade', 'phone', 'gender', 'actions'];

  openAddStudentDialog() {
    const dialogRef = this.dialog.open(AddStudentDialog);

    dialogRef.afterClosed().subscribe((result) => {
      console.log('dialog closed, result:', result);
      if (result) {
        this.students.update(current => [...current, result]);
        localStorage.setItem('students', JSON.stringify(this.students()));
      }
    });
  }

  deleteStudent(index: number) {
    this.students.update(current => current.filter((student, i) => i !== index));
    localStorage.setItem('students', JSON.stringify(this.students()));
  }

  editStudent(index: number) {
    const dialogRef = this.dialog.open(AddStudentDialog, {
      data: this.students()[index] // pass data of student to be edited
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.students.update(current => {
          const updated = [...current];
          updated[index] = result;
          return updated;
        });
        localStorage.setItem('students', JSON.stringify(this.students()));
      }
    })
    
  }
}
