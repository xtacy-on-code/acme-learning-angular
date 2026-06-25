import { Component, computed, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgDataTable, DataTableColumn } from '../../shared/ag-data-table/ag-data-table';
import { ProfessorStore } from '../../core/professor-store';
import { ProfileStore } from '../../core/profile-store';
import { finalize } from 'rxjs';
import { AddProfessorDialog } from './add-professor-dialog/add-professor-dialog';
import { bulkErrorMessage } from '../../core/http-error';

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

@Component({
  selector: 'app-professors',
  imports: [MatButtonModule, FormsModule, AgDataTable],
  templateUrl: './professors.html',
  styleUrl: './professors.css',
})
export class Professors {
  // Every visible column is inline-editable: text, number (experience), or
  // select (designation/gender). Note employeeId has a unique index — editing it
  // to a value that already exists fails server-side and the cell reverts.
  columns: DataTableColumn[] = [
    { key: 'name', label: 'Professor', sortable: true, editable: true, editorType: 'text', cellType: 'user' },
    { key: 'employeeId', label: 'Employee ID', sortable: true, editable: true, editorType: 'text', cellType: 'mono' },
    { key: 'department', label: 'Department', sortable: true, editable: true, editorType: 'text' },
    { key: 'designation', label: 'Designation', sortable: true, editable: true, editorType: 'select', editorParams: { values: DESIGNATIONS }, cellType: 'designationBadge' },
    { key: 'specialization', label: 'Specialization', sortable: true, editable: true, editorType: 'text' },
    { key: 'experience', label: 'Experience (yrs)', sortable: true, editable: true, editorType: 'number' },
    { key: 'gender', label: 'Gender', sortable: true, editable: true, editorType: 'select', editorParams: { values: ['male', 'female', 'other'] }, cellType: 'genderBadge' },
    { key: 'email', label: 'Email', sortable: true, editable: true, editorType: 'text' },
    { key: 'phone', label: 'Phone', sortable: true, editable: true, editorType: 'text', cellType: 'mono' },
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

  // --- Multi-select bulk EDIT ---
  // The slim panel binds these. Each is "leave blank = don't change", so the user
  // can set just the department, just the designation, or both, and we apply only
  // the filled-in fields to every selected row.
  designations = DESIGNATIONS;
  bulkDepartment = '';
  bulkDesignation = '';
  applying = false;

  applyBulkEdit() {
    const update: Record<string, any> = {};
    if (this.bulkDepartment.trim()) update['department'] = this.bulkDepartment.trim();
    if (this.bulkDesignation) update['designation'] = this.bulkDesignation;

    if (!Object.keys(update).length) {
      this.snackBar.open('Set a department or designation first', 'Dismiss', { duration: 3000 });
      return;
    }

    const ids = this.selectedProfessors.map((p) => p._id);
    if (!ids.length) return;

    this.applying = true;
    // finalize() guarantees `applying` is reset on success, error, OR unsubscribe —
    // so the button can never get stuck on "Applying…".
    this.professorStore
      .bulkUpdateProfessors(ids, update)
      .pipe(finalize(() => (this.applying = false)))
      .subscribe({
        next: () => {
          this.snackBar.open(`Updated ${ids.length} professor(s)`, '', { duration: 2000 });
          this.agGrid()?.flashRows(ids); // flash the just-changed rows
          this.clearBulkEdit();
        },
        error: (err) => {
          console.error('bulk update failed:', err);
          this.snackBar.open(bulkErrorMessage(err), 'Dismiss', { duration: 5000 });
        },
      });
  }

  // Deselect rows (closes the panel) and reset the panel's inputs.
  clearBulkEdit() {
    this.agGrid()?.clearSelection();
    this.selectedProfessors = [];
    this.bulkDepartment = '';
    this.bulkDesignation = '';
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
