import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { ThemePicker } from "../../shared/theme-picker/theme-picker";

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ThemePicker],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {

  constructor(private router: Router){}

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login'])
  }
}
