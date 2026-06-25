import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

// Rich "user" cell for the AG Grid wrapper: an avatar circle with initials next
// to a primary line (the cell value, e.g. name) and an optional secondary line
// (a sibling field such as email, named via cellRendererParams.secondaryField).
// Mirrors DataTable's `user` cellType so both tables look the same.
@Component({
  selector: 'app-user-cell',
  template: `
    <div class="ag-user-cell flex items-center gap-3">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
        {{ initials }}
      </div>
      <div class="min-w-0 leading-tight">
        <div class="truncate text-sm font-medium text-text">{{ primary }}</div>
        @if (secondary) {
          <div class="truncate text-xs text-faint">{{ secondary }}</div>
        }
      </div>
    </div>
  `,
  styles: [`.ag-user-cell { height: 100%; }`],
})
export class UserCellComponent implements ICellRendererAngularComp {
  primary = '';
  secondary = '';
  initials = '?';

  agInit(params: ICellRendererParams): void {
    this.primary = String(params.value ?? '');
    const secondaryField = (params as any).secondaryField as string | undefined;
    this.secondary = secondaryField ? String(params.data?.[secondaryField] ?? '') : '';
    this.initials = this.computeInitials(this.primary);
  }

  // Recreate (return false) on value change so the cell reflects edits.
  refresh(): boolean {
    return false;
  }

  private computeInitials(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
