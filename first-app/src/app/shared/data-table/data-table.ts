import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
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

  onEdit(item: any) {
    this.editClicked.emit(item)
  }

  onDelete(item: any) {
    this.deleteClicked.emit(item)
  }

  onSort(key: string) {
    this.sortChanged.emit(key);
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
