import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('first-app');

  // Instantiate ThemeService at the root so the saved theme is applied on app
  // load (it runs even on the public login/signup pages).
  constructor() {
    inject(ThemeService);
  }
}


