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
    { key: 'name', label: 'Name', sortable: true },
    { key: 'rollno', label: 'Roll No', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'grade', label: 'Grade', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'gender', label: 'Gender', sortable: true }
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

  onColumnSort(key: string) {
    this.studentStore.setSort(key);
  }

  clearFilters() {
    this.studentStore.clearAllFilters();
  }
}
