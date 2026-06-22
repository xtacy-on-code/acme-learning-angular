import { Component, computed, inject } from '@angular/core';
import { StudentStore } from '../../core/student-store';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  studentStore = inject(StudentStore);

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

  private pct(n: number): number {
    const total = this.totalStudents();
    return total ? Math.round((n / total) * 100) : 0;
  }
}