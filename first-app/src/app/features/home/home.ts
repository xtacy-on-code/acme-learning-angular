import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { StudentStore } from '../../core/student-store';
import { ThemeService } from '../../core/theme.service';
import { ChartComponent } from '../../shared/chart/chart';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { GridStack, GridStackNode } from 'gridstack';

// Where the user's customized dashboard arrangement is remembered (per browser).
const LAYOUT_KEY = 'acme-home-layout';
type Pos = { x: number; y: number; w: number; h: number };

@Component({
  selector: 'app-home',
  imports: [RouterLink, ChartComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {
  studentStore = inject(StudentStore);
  private themeService = inject(ThemeService);

  private gridEl = viewChild.required<ElementRef<HTMLElement>>('grid');
  private grid?: GridStack;

  // Default dashboard arrangement on a 12-column grid (widget id → position/size).
  readonly defaultLayout: Record<string, Pos> = {
    total: { x: 0, y: 0, w: 3, h: 2 },
    male: { x: 3, y: 0, w: 3, h: 2 },
    female: { x: 6, y: 0, w: 3, h: 2 },
    other: { x: 9, y: 0, w: 3, h: 2 },
    grade: { x: 0, y: 2, w: 8, h: 4 },
    gender: { x: 8, y: 2, w: 4, h: 4 },
  };

  // Seeds the grid items' gs-* attributes: the saved layout if the user has
  // customized it, otherwise the default. Read once for the initial render;
  // GridStack owns positions after init.
  layout: Record<string, Pos> = this.loadLayout();

  constructor() {
    // Whole-collection counts (computed on the DB) — independent of the paginated
    // list, so these reflect ALL students, not just the current page.
    this.studentStore.loadStats();
  }

  ngAfterViewInit() {
    this.grid = GridStack.init(
      {
        column: 12,
        cellHeight: 76,
        margin: 8,
        // float:false = "magnetic": boxes gravitate up and pack together instead of
        // floating wherever dropped with gaps above them.
        float: false,
        // Collapse to a single column on narrow screens so the grid stays usable.
        columnOpts: { breakpointForWindow: true, breakpoints: [{ w: 768, c: 1 }] },
        // The whole card is draggable; only real interactive elements cancel a drag
        // (so the "View all" link still navigates and form-ish controls still click).
        draggable: { cancel: 'a, button, input, select, textarea' },
        // Resize from any edge or corner (handles themselves are styled invisible in
        // styles.css — the cursor changes on hover, which suits the rounded cards).
        resizable: { handles: 'n,ne,e,se,s,sw,w,nw' },
      },
      this.gridEl().nativeElement,
    );
    // Persist on any drag/resize so the arrangement survives a reload.
    this.grid.on('change', () => this.saveLayout());
  }

  ngOnDestroy() {
    // Tear down GridStack but leave the DOM — Angular owns these elements.
    this.grid?.destroy(false);
  }

  private loadLayout(): Record<string, Pos> {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) return { ...this.defaultLayout, ...JSON.parse(raw) };
    } catch {
      /* ignore corrupt storage; fall back to default */
    }
    return { ...this.defaultLayout };
  }

  private saveLayout() {
    if (!this.grid) return;
    const map: Record<string, Pos> = {};
    (this.grid.save(false) as GridStackNode[]).forEach((n) => {
      if (n.id != null) map[String(n.id)] = { x: n.x ?? 0, y: n.y ?? 0, w: n.w ?? 1, h: n.h ?? 1 };
    });
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(map));
  }

  // Restore the default arrangement (and clear the saved one).
  resetLayout() {
    localStorage.removeItem(LAYOUT_KEY);
    const grid = this.grid;
    if (!grid) return;
    // Turn gravity OFF while we set positions, so moving one box can't shove another
    // (with float:false a not-yet-moved box collides and gets pushed below grade —
    // the intermittent bug). Each box then lands exactly where told.
    grid.float(true);
    grid.batchUpdate();
    for (const [id, p] of Object.entries(this.defaultLayout)) {
      const el = this.gridEl().nativeElement.querySelector(`[gs-id="${id}"]`) as HTMLElement | null;
      if (el) grid.update(el, { ...p, autoPosition: false });
    }
    grid.batchUpdate(false); // end the batch (GridStack 12 replaced commit())
    // Restore magnetic behavior. The default layout is already fully packed, so this
    // re-compaction is a no-op — but it re-enables gravity for subsequent drags.
    grid.float(false);
  }

  totalStudents = computed(() => this.studentStore.stats().total);
  maleCount = computed(() => this.studentStore.stats().male);
  femaleCount = computed(() => this.studentStore.stats().female);
  otherCount = computed(() => this.studentStore.stats().other);

  // Share-of-total for each gender — an honest "indicator" computed from real data
  // (no fabricated trends), shown as a small chip on each stat card.
  malePct = computed(() => this.pct(this.maleCount()));
  femalePct = computed(() => this.pct(this.femaleCount()));
  otherPct = computed(() => this.pct(this.otherCount()));

  // Canvas charts can't use CSS classes, so we read the active theme's colors straight
  // from the `--c-*` custom properties at runtime and feed them to Chart.js.
  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Gender breakdown doughnut. Reads `themeService.theme()` so it recomputes on a theme
  // switch (the ThemeService effect has already flipped `data-theme`, so cssVar() returns
  // the new palette); the fresh config hands ChartComponent a redraw.
  genderChartConfig = computed<ChartConfiguration>(() => {
    this.themeService.theme(); // dependency: re-read colors when the theme changes
    const primary = this.cssVar('--c-primary');
    const muted = this.cssVar('--c-muted');
    const border = this.cssVar('--c-border');

    return {
      type: 'doughnut',
      data: {
        labels: ['Male', 'Female', 'Other'],
        datasets: [
          {
            data: [this.maleCount(), this.femaleCount(), this.otherCount()],
            backgroundColor: [primary, muted, border],
            borderColor: this.cssVar('--c-surface'),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: this.cssVar('--c-text') } },
        },
      },
    };
  });

  // Grade distribution bar chart.
  gradeChartConfig = computed<ChartConfiguration>(() => {
    this.themeService.theme(); // dependency: re-read colors when the theme changes
    const primary = this.cssVar('--c-primary');
    const muted = this.cssVar('--c-muted');
    const border = this.cssVar('--c-border');
    // Guard against an older /stats payload (e.g. a stale Redis cache from before the
    // byGrade aggregation existed) that omits this field. Sort with a numeric-aware
    // compare so grades read ascending ("2" before "10", "9A" before "10B") instead of
    // the backend's lexicographic string order. Copy first — don't mutate store state.
    const byGrade = [...(this.studentStore.stats().byGrade ?? [])].sort((a, b) =>
      a.grade.localeCompare(b.grade, undefined, { numeric: true }),
    );

    return {
      type: 'bar',
      data: {
        labels: byGrade.map((g) => g.grade),
        datasets: [
          {
            label: 'Students',
            data: byGrade.map((g) => g.count),
            backgroundColor: primary,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: muted }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: muted, precision: 0 },
            grid: { color: border },
          },
        },
      },
    };
  });

  private pct(n: number): number {
    const total = this.totalStudents();
    return total ? Math.round((n / total) * 100) : 0;
  }
}
