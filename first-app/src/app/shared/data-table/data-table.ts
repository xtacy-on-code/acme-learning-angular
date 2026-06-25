import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  // Optional rich-cell rendering hint (mirrors the AG Grid wrapper's column shape
  // so the two tables stay interchangeable). 'text' (default) renders plain text.
  cellType?: 'user' | 'mono' | 'pill' | 'genderBadge' | 'designationBadge' | 'text';
  // For the 'user' cell: the field holding the secondary line (e.g. email).
  secondaryKey?: string;
}

@Component({
  selector: 'app-data-table',
  imports: [MatTableModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable implements OnChanges {
  @Input() columns: DataTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;

  @Input() showEdit: boolean=true;
  @Input() showDelete: boolean=true;

  // When true, a leading checkbox column lets the user multi-select rows.
  @Input() selectable: boolean = false;

  // Row _ids to briefly flash-highlight (e.g. just after a bulk edit). Set it to
  // the changed ids, then clear it after the animation; rows in this list get the
  // `.row-flash` class, which runs a fade-back-to-normal CSS animation.
  @Input() highlightIds: string[] = [];

  // Fixed set of placeholder rows rendered while loading (skeleton state).
  readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  @Input() sortBy: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';

  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();
  @Output() sortChanged = new EventEmitter<string>();
  // Emits the current selection (the actual row objects) whenever it changes.
  @Output() selectionChanged = new EventEmitter<any[]>();

  readonly selection = new SelectionModel<any>(true, []);

  ngOnChanges(changes: SimpleChanges) {
    // The data array is replaced on every reload/page-change/delete; a stale
    // selection (referencing rows no longer shown) would be misleading, so clear it.
    if (changes['data']) {
      this.selection.clear();
      this.selectionChanged.emit([]);
    }
  }

  isAllSelected(): boolean {
    return this.data.length > 0 && this.selection.selected.length === this.data.length;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.data.forEach((row) => this.selection.select(row));
    }
    this.selectionChanged.emit(this.selection.selected);
  }

  toggleRow(row: any) {
    this.selection.toggle(row);
    this.selectionChanged.emit(this.selection.selected);
  }

  // Clear the selection on demand (e.g. a parent's "Cancel" on a bulk-action bar).
  // Distinct from the ngOnChanges auto-clear, which only fires when `data` changes.
  clearSelection() {
    this.selection.clear();
    this.selectionChanged.emit([]);
  }

  onEdit(item: any) {
    this.editClicked.emit(item)
  }

  onDelete(item: any) {
    this.deleteClicked.emit(item)
  }

  onSort(key: string) {
    this.sortChanged.emit(key);
  }

  // First-letter(s) for an avatar circle. Uses the first two words' initials,
  // falling back to a single char. Pure — used by the 'user' rich cell.
  initials(value: any): string {
    const name = String(value ?? '').trim();
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  // Tailwind tint classes for the gender badge. Lowercased so it matches the
  // schema enum regardless of how the value is cased.
  genderBadgeClass(value: any): string {
    switch (String(value ?? '').toLowerCase()) {
      case 'male':
        return 'bg-sky-500/15 text-sky-500';
      case 'female':
        return 'bg-pink-500/15 text-pink-500';
      default:
        return 'bg-surface-2 text-muted';
    }
  }

  get displayedColumns(): string[] {
    const cols: string[] = [];
    if (this.selectable) cols.push('select');
    cols.push(...this.columns.map((c) => c.key));
    if (this.showEdit || this.showDelete) {
      cols.push('actions');
    }

    return cols;
  }
}
