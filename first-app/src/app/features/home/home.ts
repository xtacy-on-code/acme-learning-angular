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

}