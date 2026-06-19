import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddStudentDialog } from './add-student-dialog/add-student-dialog';
import { MatButtonModule } from '@angular/material/button';
import { DataTable } from "../../shared/data-table/data-table";
import { StudentStore } from '../../core/student-store';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'


@Component({
  selector: 'app-students',
  imports: [MatButtonModule, DataTable, MatPaginatorModule],
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

  studentStore = inject(StudentStore);

  constructor(private dialog: MatDialog) {
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

  onSearch(value: string) {
    this.studentStore.setSearch(value);
  }

  onPageChange(event: PageEvent) {
    this.studentStore.setPage(event.pageIndex + 1);
  }

  onFilterChange(key: string, value: string) {
    this.studentStore.setFilter(key, value);
  }

  clearFilters() {
    this.studentStore.clearAllFilters();
  }
}
