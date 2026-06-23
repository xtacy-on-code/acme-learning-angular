import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

// Custom cell renderer for the actions column: edit / delete ghost buttons,
// mirroring DataTable's API and look. Click callbacks are routed back to the
// parent AgDataTable via params.context.componentParent, which re-emits them as
// the wrapper's editClicked / deleteClicked outputs.
@Component({
  selector: 'app-actions-cell',
  template: `
    <div class="ag-row-actions flex gap-1">
      @if (showEdit) {
        <button type="button" class="ag-action-btn edit-btn" (click)="onEdit()" aria-label="Edit">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
          </svg>
        </button>
      }
      @if (showDelete) {
        <button type="button" class="ag-action-btn delete-btn" (click)="onDelete()" aria-label="Delete">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    .ag-row-actions { align-items: center; height: 100%; }
    .ag-action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 30px;
      width: 30px;
      border: none;
      background: none;
      border-radius: 9999px;
      color: var(--c-muted);
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease, color 0.15s ease;
    }
    .ag-action-btn:hover { transform: scale(1.1); }
    .ag-action-btn.edit-btn:hover {
      background-color: color-mix(in srgb, var(--c-primary) 15%, transparent);
      color: var(--c-primary);
    }
    .ag-action-btn.delete-btn:hover {
      background-color: rgba(220, 38, 38, 0.15);
      color: #DC2626;
    }
  `],
})
export class ActionsCellComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams;
  showEdit = true;
  showDelete = true;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.showEdit = (params as any).showEdit ?? true;
    this.showDelete = (params as any).showDelete ?? true;
  }

  refresh(): boolean {
    return false;
  }

  onEdit() {
    this.params.context?.componentParent?.onEdit(this.params.data);
  }

  onDelete() {
    this.params.context?.componentParent?.onDelete(this.params.data);
  }
}
