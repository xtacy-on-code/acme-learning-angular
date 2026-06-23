import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AgDataTable } from '../../shared/ag-data-table/ag-data-table';
import { ProfessorStore } from '../../core/professor-store';
import { AddProfessorDialog } from './add-professor-dialog/add-professor-dialog';

@Component({
  selector: 'app-professors',
  imports: [MatButtonModule, AgDataTable],
  templateUrl: './professors.html',
  styleUrl: './professors.css',
})
export class Professors {
  columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'employeeId', label: 'Employee ID', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'designation', label: 'Designation', sortable: true },
    { key: 'specialization', label: 'Specialization', sortable: true },
    { key: 'experience', label: 'Experience (yrs)', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
  ];

  professorStore = inject(ProfessorStore);

  constructor(private dialog: MatDialog) {
    this.professorStore.loadProfessors();
  }

  openAddProfessorDialog() {
    const dialogRef = this.dialog.open(AddProfessorDialog);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.professorStore.addProfessor(result);
      }
    });
  }

  editProfessor(professor: any) {
    const dialogRef = this.dialog.open(AddProfessorDialog, { data: professor });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.professorStore.updateProfessor(professor._id, result);
      }
    });
  }

  deleteProfessor(professor: any) {
    this.professorStore.deleteProfessor(professor);
  }
}
