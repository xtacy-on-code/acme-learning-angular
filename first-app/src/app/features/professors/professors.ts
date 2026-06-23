import { Component, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AgDataTable } from '../../shared/ag-data-table/ag-data-table';
import { ProfessorStore } from '../../core/professor-store';
import { ProfileStore } from '../../core/profile-store';
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
  private profileStore = inject(ProfileStore);

  // Students can view professors but not mutate them; only professors get the
  // add/edit/delete controls. Backend enforces the same (403 on writes).
  canManage = computed(() => this.profileStore.user()?.role === 'professor');

  constructor(private dialog: MatDialog) {
    this.professorStore.loadProfessors();
    this.profileStore.loadProfile();
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
