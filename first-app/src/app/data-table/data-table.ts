import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-data-table',
  imports: [MatTableModule, MatButtonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable {
  @Input() columns: { key: string; label: string}[] = [];
  @Input() data: any[] = [];

  @Input() showEdit: boolean=true;
  @Input() showDelete: boolean=true;

  @Output() editClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();

  onEdit(item: any) {
    this.editClicked.emit(item)
  }

  onDelete(item: any) {
    this.deleteClicked.emit(item)
  }

  get displayedColumns(): string[] {
    const cols = this.columns.map(c => c.key);
    if (this.showEdit || this.showDelete) {
      cols.push('actions');
    }

    return cols;
  }
}
