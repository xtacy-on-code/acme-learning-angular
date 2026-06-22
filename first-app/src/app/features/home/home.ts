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
    this.studentStore.loadStudents();
  }

  totalStudents = computed(() => this.studentStore.students().length);

  maleCount = computed(() =>
    this.studentStore.students().filter(s => s.gender === 'male').length
  );

  femaleCount = computed(() =>
    this.studentStore.students().filter(s => s.gender === 'female').length
  );

  otherCount = computed(() =>
    this.studentStore.students().filter(s => s.gender === 'other').length
  );

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