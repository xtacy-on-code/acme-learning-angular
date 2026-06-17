import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-student-table',
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './student-table.html',
  styleUrl: './student-table.css',
})
export class StudentTable {
  displayedColumns: string[] = ['name', 'rollno', 'email', 'grade', 'phone', 'gender', 'actions'];

  @Input() students: any[] = [];

  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();

  onEdit(student: any) {
    this.editClicked.emit(student)
  }

  onDelete(student: any) {
    this.deleteClicked.emit(student)
  }
}
