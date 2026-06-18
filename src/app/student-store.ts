import { Injectable, signal } from '@angular/core';
import { Student } from './student';

@Injectable({
  providedIn: 'root',
})

export class StudentStore {
  students = signal<any[]>([]);
  private loaded = false;

  constructor(private studentService: Student){}

  loadStudents() {
    if (this.loaded) return; // if already loaded, no api call again

    this.studentService.getStudents().subscribe({
      next: (data: any) => {
        this.students.set(data);
        this.loaded = true; // loaded data so now true
      },
      error: (err) => console.log('error loading students: ', err)
    })
  }

  updateStudent(id: string, data: any) {
    this.studentService.updateStudent(id, data).subscribe({
      next: (res: any) => {
        this.students.update(current => current.map(s => s._id === id? res.student : s));
      },
      error: (err) => console.log('error updating student: ', err)
    })
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

  addStudent(data: any) {
    this.studentService.addStudent(data).subscribe({
      next: (res: any) => {
        this.students.update(current => [...current, res.student]);
      },
      error: (err) => console.log('error adding student: ', err)
    });
  }

}
