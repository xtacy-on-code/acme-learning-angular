import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable {
  @Input() columns: DataTableColumn[] = [];
  @Input() data: any[] = [];

  @Input() showEdit: boolean=true;
  @Input() showDelete: boolean=true;

  @Input() sortBy: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';

  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();
  @Output() sortChanged = new EventEmitter<string>();

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
    const cols = this.columns.map(c => c.key);
    if (this.showEdit || this.showDelete) {
      cols.push('actions');
    }

    return cols;
  }
}
