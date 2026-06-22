import { Component, computed, inject } from '@angular/core';
import { StudentStore } from '../../core/student-store';
import { ThemeService } from '../../core/theme.service';
import { ChartComponent } from '../../shared/chart/chart';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ChartComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  studentStore = inject(StudentStore);
  private themeService = inject(ThemeService);

  constructor() {
    // Whole-collection counts (computed on the DB) — independent of the paginated
    // list, so these reflect ALL students, not just the current page.
    this.studentStore.loadStats();
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
