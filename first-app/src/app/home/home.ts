import { Component, computed } from '@angular/core';
import { StudentStore } from '../student-store';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(public studentStore: StudentStore) {
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