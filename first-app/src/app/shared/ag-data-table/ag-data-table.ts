import { Component, computed, input, output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';
import { ActionsCellComponent } from './actions-cell';

// Register AG Grid's community features once, before any grid renders. Done here
// (not in main.ts) so AllCommunityModule lands in the lazy-loaded chunk that uses
// the grid rather than the initial bundle — same reasoning as lazy-loading Home
// to keep Chart.js out of main.
ModuleRegistry.registerModules([AllCommunityModule]);

// Same column shape as DataTable (shared/data-table) so the two tables are
// interchangeable from a caller's point of view. The edit-related fields are
// AG-Grid-only extras DataTable ignores.
export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  editable?: boolean;
  editorType?: 'text' | 'number' | 'select';
  editorParams?: { values: string[] };
}

// Theme built with AG Grid's modern Theming API (not the legacy CSS themes).
// Colors reference the app's --c-* CSS variables, so flipping `data-theme` on
// <html> recolors the grid live — same approach as the --mat-sys-* remap that
// themes Angular Material. No JS recompute needed on theme switch.
export const acmeGridTheme = themeQuartz.withParams({
  backgroundColor: 'var(--c-surface)',
  foregroundColor: 'var(--c-text)',
  headerBackgroundColor: 'var(--c-surface-hover)',
  headerTextColor: 'var(--c-text)',
  borderColor: 'var(--c-border)',
  rowHoverColor: 'var(--c-surface-hover)',
  accentColor: 'var(--c-primary)',
});

// Reusable AG Grid wrapper (sibling to shared/data-table). Client-side row
// model handles sorting/filtering/pagination — we don't reimplement what AG Grid
// already does. Mirrors DataTable's inputs/outputs so feature pages stay simple.
@Component({
  selector: 'app-ag-data-table',
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      class="block w-full"
      [theme]="theme"
      [domLayout]="'autoHeight'"
      [rowData]="data()"
      [columnDefs]="colDefs()"
      [defaultColDef]="defaultColDef"
      [getRowId]="getRowId"
      [context]="context"
      [loading]="loading()"
      [pagination]="true"
      [paginationPageSize]="10"
      [paginationPageSizeSelector]="[10, 20, 50]"
      [animateRows]="true"
      (gridReady)="onGridReady($event)"
      (cellValueChanged)="onCellValueChanged($event)">
    </ag-grid-angular>
  `,
  // autoHeight sizes the grid to its rows, so we don't depend on a fixed-height
  // parent (which AG Grid otherwise requires — a 0-height container renders blank).
  styles: [`:host { display: block; width: 100%; }`],
})
export class AgDataTable {
  readonly columns = input<DataTableColumn[]>([]);
  readonly data = input<any[]>([]);
  readonly loading = input<boolean>(false);
  readonly showEdit = input<boolean>(true);
  readonly showDelete = input<boolean>(true);
  // Master toggle for inline cell editing — even columns flagged `editable` are
  // only editable when this is true (the Professors page binds it to canManage,
  // so students get a read-only grid).
  readonly editable = input<boolean>(true);

  readonly editClicked = output<any>();
  readonly deleteClicked = output<any>();
  // Emitted once per committed cell edit (blur/Enter) with a real value change.
  readonly cellEdited = output<{ id: string; field: string; oldValue: any; newValue: any }>();

  readonly theme = acmeGridTheme;

  // Captured from (gridReady) so revertCell() can drive a single cell via the API.
  private gridApi?: GridApi;

  // Tell AG Grid to key row nodes by Mongo _id (not array index). This makes
  // getRowNode(_id) work for revertCell, and lets AG Grid track rows across the
  // store's full-list refetches instead of remounting everything.
  readonly getRowId = (params: GetRowIdParams) => params.data._id;

  readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
    resizable: true,
  };

  // Passed to AG Grid so the actions cell renderer can call back into this
  // component (see ActionsCellComponent.onEdit/onDelete).
  readonly context = { componentParent: this };

  readonly colDefs = computed<ColDef[]>(() => {
    const editingOn = this.editable();
    const cols: ColDef[] = this.columns().map((c) => {
      const def: ColDef = {
        field: c.key,
        headerName: c.label,
        sortable: c.sortable ?? true,
        editable: editingOn && (c.editable ?? false),
      };
      // Pick the AG Grid built-in editor. 'text' is the default (no cellEditor).
      if (c.editorType === 'number') {
        def.cellEditor = 'agNumberCellEditor';
      } else if (c.editorType === 'select') {
        def.cellEditor = 'agSelectCellEditor';
        def.cellEditorParams = { values: c.editorParams?.values ?? [] };
      }
      return def;
    });

    if (this.showEdit() || this.showDelete()) {
      cols.push({
        headerName: 'Actions',
        colId: 'actions',
        cellRenderer: ActionsCellComponent,
        cellRendererParams: { showEdit: this.showEdit(), showDelete: this.showDelete() },
        sortable: false,
        filter: false,
        resizable: false,
        flex: 0,
        width: 120,
      });
    }

    return cols;
  });

  onEdit(data: any) {
    this.editClicked.emit(data);
  }

  onDelete(data: any) {
    this.deleteClicked.emit(data);
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
  }

  onCellValueChanged(event: CellValueChangedEvent) {
    // AG Grid can fire this with no real change — ignore those.
    if (event.oldValue === event.newValue) return;
    this.cellEdited.emit({
      id: event.data._id,
      field: event.colDef.field!,
      oldValue: event.oldValue,
      newValue: event.newValue,
    });
  }

  // Roll a single cell back to its previous value (used on a failed save).
  revertCell(rowId: string, field: string, oldValue: any) {
    this.gridApi?.getRowNode(rowId)?.setDataValue(field, oldValue);
  }
}
