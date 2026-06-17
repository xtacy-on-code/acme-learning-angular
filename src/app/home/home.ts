import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  students: any[] = [];
  totalStudents = 0;
  maleCount = 0;
  femaleCount = 0;
  otherCount = 0;
  gradeBreakdown: { grade: string; count: number }[] = [];

  constructor() {
    const raw = localStorage.getItem('students');
    this.students = raw && raw !== 'undefined' ? JSON.parse(raw) : [];

    this.totalStudents = this.students.length;
    this.maleCount = this.students.filter(s => s.gender === 'male').length;
    this.femaleCount = this.students.filter(s => s.gender === 'female').length;
    this.otherCount = this.students.filter(s => s.gender === 'other').length;

    const counts = this.students.reduce((acc: Record<string, number>, student) => {
      const grade = student.grade || 'Unspecified';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    this.gradeBreakdown = Object.entries(counts)
      .map(([grade, count]) => ({ grade, count: count as number }))
      .sort((a, b) => Number(a.grade) - Number(b.grade));
  }
}