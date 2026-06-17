import { Component, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddStudentDialog } from '../add-student-dialog/add-student-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Student } from '../student';


@Component({
  selector: 'app-students',
  imports: [MatButtonModule, MatTableModule],
  templateUrl: './students.html',
  styleUrl: './students.css',
})


export class Students{
  students = signal<any[]>([]);
  displayedColumns: string[] = ['name', 'rollno', 'email', 'grade', 'phone', 'gender', 'actions'];

  constructor(private dialog: MatDialog, private studentService: Student) {
    this.loadStudents();
  }

  loadStudents() {
    this.studentService.getStudents().subscribe({
      next: (data: any) => {
        this.students.set(data);
      },
      error: (err) => {
        console.log('error fetching students: ', err);
      }
    });
  }

  openAddStudentDialog() {
    const dialogRef = this.dialog.open(AddStudentDialog);

    dialogRef.afterClosed().subscribe((result) => {
      console.log('dialog closed, result:', result);
      if (result) {
        this.studentService.addStudent(result).subscribe({
          next: (res: any) => {
            this.students.update(current => [...current, res.student]);
          },
          error: (err) => {
            console.log('error adding student: ', err);
          }
        })
      }
    });
  }

  deleteStudent(student: any) {
    this.studentService.deleteStudent(student._id).subscribe({
      next: () => {
        this.students.update(current => current.filter(s => s._id !== student._id));
      },
      error: (err) => {
        console.log('error deleting student: ', err);
      }
    })
  }

  editStudent(student: any) {
    const dialogRef = this.dialog.open(AddStudentDialog, {
      data: student 
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.studentService.updateStudent(student._id, result).subscribe({
          next: (res: any) => {
            this.students.update(current =>
              current.map(s => s._id === student._id ? res.student : s)
            )
          },
          error: (err) => {
            console.log('error updating students: ', err);
          }
        });
      }
    })
    
  }
}
