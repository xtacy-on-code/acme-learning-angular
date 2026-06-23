import { Component, computed, inject, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgDataTable, DataTableColumn } from '../../shared/ag-data-table/ag-data-table';
import { ProfessorStore } from '../../core/professor-store';
import { ProfileStore } from '../../core/profile-store';
import { AddProfessorDialog } from './add-professor-dialog/add-professor-dialog';

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

@Component({
  selector: 'app-professors',
  imports: [MatButtonModule, AgDataTable],
  templateUrl: './professors.html',
  styleUrl: './professors.css',
})
export class Professors {
  // Every visible column is inline-editable: text, number (experience), or
  // select (designation/gender). Note employeeId has a unique index — editing it
  // to a value that already exists fails server-side and the cell reverts.
  columns: DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, editable: true, editorType: 'text' },
    { key: 'employeeId', label: 'Employee ID', sortable: true, editable: true, editorType: 'text' },
    { key: 'department', label: 'Department', sortable: true, editable: true, editorType: 'text' },
    { key: 'designation', label: 'Designation', sortable: true, editable: true, editorType: 'select', editorParams: { values: DESIGNATIONS } },
    { key: 'specialization', label: 'Specialization', sortable: true, editable: true, editorType: 'text' },
    { key: 'experience', label: 'Experience (yrs)', sortable: true, editable: true, editorType: 'number' },
    { key: 'gender', label: 'Gender', sortable: true, editable: true, editorType: 'select', editorParams: { values: ['male', 'female', 'other'] } },
    { key: 'email', label: 'Email', sortable: true, editable: true, editorType: 'text' },
    { key: 'phone', label: 'Phone', sortable: true, editable: true, editorType: 'text' },
  ];

  // Reference to the grid wrapper so we can revert a cell on a failed save.
  private agGrid = viewChild(AgDataTable);

  professorStore = inject(ProfessorStore);
  private profileStore = inject(ProfileStore);
  private snackBar = inject(MatSnackBar);

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

  deleteProfessor(professor: any) {
    this.professorStore.deleteProfessor(professor);
  }

  // --- Multi-select bulk delete ---
  selectedProfessors: any[] = [];

  onSelectionChanged(rows: any[]) {
    this.selectedProfessors = rows;
  }

  bulkDeleteSelected() {
    const ids = this.selectedProfessors.map((p) => p._id);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected professor(s)? This cannot be undone.`)) return;
    this.professorStore.bulkDeleteProfessors(ids);
    this.selectedProfessors = [];
  }

  // One committed cell edit → one PATCH-style request. Optimistic: AG Grid
  // already shows the new value; on failure we roll the cell back and toast.
  onCellEdited(e: { id: string; field: string; oldValue: any; newValue: any }) {
    this.professorStore.updateField(e.id, e.field, e.newValue).subscribe({
      next: () => this.snackBar.open('Saved', '', { duration: 1500 }),
      error: (err) => {
        this.agGrid()?.revertCell(e.id, e.field, e.oldValue);
        const msg = err?.error?.details || err?.error?.error || 'Update failed';
        this.snackBar.open(msg, 'Dismiss', { duration: 4000 });
      },
    });
  }
}
