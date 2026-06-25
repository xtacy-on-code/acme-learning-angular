import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

// Colored pill cell for the AG Grid wrapper. `badgeType` (via cellRendererParams)
// selects the tint scheme: 'gender' (male/female/other) or 'designation' (faculty
// rank). Coexists with inline editing — when a cell is editable, double-click swaps
// in AG Grid's editor; on commit this renderer is recreated with the new value.
@Component({
  selector: 'app-badge-cell',
  template: `
    @if (value) {
      <span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" [class]="tint">
        {{ value }}
      </span>
    }
  `,
  styles: [`:host { display: inline-flex; align-items: center; height: 100%; }`],
})
export class BadgeCellComponent implements ICellRendererAngularComp {
  value = '';
  tint = 'bg-surface-2 text-muted';

  agInit(params: ICellRendererParams): void {
    this.value = String(params.value ?? '');
    const badgeType = (params as any).badgeType as 'gender' | 'designation' | undefined;
    this.tint = badgeType === 'gender' ? this.genderTint(this.value) : this.designationTint(this.value);
  }

  refresh(): boolean {
    return false;
  }

  private genderTint(v: string): string {
    switch (v.toLowerCase()) {
      case 'male':
        return 'bg-sky-500/15 text-sky-500';
      case 'female':
        return 'bg-pink-500/15 text-pink-500';
      default:
        return 'bg-surface-2 text-muted';
    }
  }

  private designationTint(v: string): string {
    switch (v) {
      case 'Professor':
        return 'bg-primary/12 text-primary';
      case 'Associate Professor':
        return 'bg-violet-500/15 text-violet-500';
      case 'Assistant Professor':
        return 'bg-teal-500/15 text-teal-500';
      default:
        return 'bg-surface-2 text-muted';
    }
  }
}
