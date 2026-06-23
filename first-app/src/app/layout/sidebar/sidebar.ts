import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { ThemePicker } from "../../shared/theme-picker/theme-picker";
import { ProfileStore } from '../../core/profile-store';
import { StudentStore } from '../../core/student-store';
import { ProfessorStore } from '../../core/professor-store';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ThemePicker],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  // Shared root singleton — same `user` signal the header reads. Used to show
  // the Professors link only for professors. loadProfile() is a no-op once loaded.
  store = inject(ProfileStore);
  private studentStore = inject(StudentStore);
  private professorStore = inject(ProfessorStore);

  constructor(private router: Router){
    this.store.loadProfile();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    // Clear the root-singleton stores so the next user who logs in doesn't see
    // the previous user's cached profile/data.
    this.store.reset();
    this.studentStore.reset();
    this.professorStore.reset();
    this.router.navigate(['/login'])
  }
}
