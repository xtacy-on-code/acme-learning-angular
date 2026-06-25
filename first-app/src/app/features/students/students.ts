import { Component, computed, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddStudentDialog } from './add-student-dialog/add-student-dialog';
import { MatButtonModule } from '@angular/material/button';
import { DataTable, DataTableColumn } from "../../shared/data-table/data-table";
import { StudentStore } from '../../core/student-store';
import { ProfileStore } from '../../core/profile-store';
import { bulkErrorMessage } from '../../core/http-error';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { finalize } from 'rxjs'


@Component({
  selector: 'app-students',
  imports: [MatButtonModule, FormsModule, DataTable, MatPaginatorModule],
  templateUrl: './students.html',
  styleUrl: './students.css',
})


export class Students{
  columns: DataTableColumn[] = [
    { key: 'name', label: 'Student', sortable: true, cellType: 'user', secondaryKey: 'email' },
    { key: 'rollno', label: 'Roll No', sortable: true, cellType: 'mono' },
    { key: 'grade', label: 'Grade', sortable: true, cellType: 'pill' },
    { key: 'phone', label: 'Phone', sortable: true, cellType: 'mono' },
    { key: 'gender', label: 'Gender', sortable: true, cellType: 'genderBadge' },
  ];

  studentStore = inject(StudentStore);
  private profileStore = inject(ProfileStore);
  private snackBar = inject(MatSnackBar);

  // Reference to the table so "Cancel" can clear its checkbox selection.
  private dataTable = viewChild(DataTable);

  // Grade/gender option lists for the bulk-edit panel selects.
  grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Gender filter chips ('' = all). Bound to the toolbar's segmented control.
  genderChips = [
    { value: '', label: 'All' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  // Only professors may add/edit/delete; students get a read-only table.
  // Reads the shared ProfileStore signal (header/sidebar already populate it).
  canManage = computed(() => this.profileStore.user()?.role === 'professor');

  constructor(private dialog: MatDialog) {
    this.studentStore.loadStudents();
    this.profileStore.loadProfile();
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

  // --- Multi-select bulk delete ---
  selectedStudents: any[] = [];

  onSelectionChanged(rows: any[]) {
    this.selectedStudents = rows;
  }

  bulkDeleteSelected() {
    const ids = this.selectedStudents.map((s) => s._id);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected student(s)? This cannot be undone.`)) return;
    this.studentStore.bulkDeleteStudents(ids);
    this.selectedStudents = [];
  }

  // --- Multi-select bulk EDIT ---
  // "Leave blank = don't change", so the user can set just the grade, just the
  // gender, or both, and we apply only the filled-in fields to every selected row.
  bulkGrade = '';
  bulkGender = '';
  applying = false;
  // _ids of rows to flash after a successful bulk edit (cleared once it fades).
  highlightIds: string[] = [];

  applyBulkEdit() {
    const update: Record<string, any> = {};
    if (this.bulkGrade) update['grade'] = this.bulkGrade;
    if (this.bulkGender) update['gender'] = this.bulkGender;

    if (!Object.keys(update).length) {
      this.snackBar.open('Set a grade or gender first', 'Dismiss', { duration: 3000 });
      return;
    }

    const ids = this.selectedStudents.map((s) => s._id);
    if (!ids.length) return;

    this.applying = true;
    // finalize() guarantees `applying` is reset on success, error, OR unsubscribe —
    // so the button can never get stuck on "Applying…".
    this.studentStore
      .bulkUpdateStudents(ids, update)
      .pipe(finalize(() => (this.applying = false)))
      .subscribe({
        next: () => {
          this.snackBar.open(`Updated ${ids.length} student(s)`, '', { duration: 2000 });
          // The patched list replaces the array, which clears the Material table's
          // selection (and emits []), so the panel closes on its own — just reset
          // the inputs. Flash the changed rows, then clear it after the animation.
          this.bulkGrade = '';
          this.bulkGender = '';
          this.highlightIds = ids;
          setTimeout(() => (this.highlightIds = []), 1900);
        },
        error: (err) => {
          console.error('bulk update failed:', err);
          this.snackBar.open(bulkErrorMessage(err), 'Dismiss', { duration: 5000 });
        },
      });
  }

  clearBulkEdit() {
    this.dataTable()?.clearSelection();
    this.bulkGrade = '';
    this.bulkGender = '';
    this.selectedStudents = [];
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
