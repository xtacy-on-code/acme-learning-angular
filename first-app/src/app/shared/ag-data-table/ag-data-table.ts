import { Component, computed, input, output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { ActionsCellComponent } from './actions-cell';

// Register AG Grid's community features once, before any grid renders. Done here
// (not in main.ts) so AllCommunityModule lands in the lazy-loaded chunk that uses
// the grid rather than the initial bundle — same reasoning as lazy-loading Home
// to keep Chart.js out of main.
ModuleRegistry.registerModules([AllCommunityModule]);

// Same column shape as DataTable (shared/data-table) so the two tables are
// interchangeable from a caller's point of view.
export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
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
      [context]="context"
      [loading]="loading()"
      [pagination]="true"
      [paginationPageSize]="10"
      [paginationPageSizeSelector]="[10, 20, 50]"
      [animateRows]="true">
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

  readonly editClicked = output<any>();
  readonly deleteClicked = output<any>();

  readonly theme = acmeGridTheme;

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
    const cols: ColDef[] = this.columns().map((c) => ({
      field: c.key,
      headerName: c.label,
      sortable: c.sortable ?? true,
    }));

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
}
