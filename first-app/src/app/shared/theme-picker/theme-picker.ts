import { Component, inject } from '@angular/core';
import { THEMES, ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-theme-picker',
  imports: [],
  template: `
    <div class="flex items-center gap-2">
      @for (t of themes; track t.id) {
        <button
          type="button"
          (click)="theme.setTheme(t.id)"
          [title]="t.label"
          [attr.aria-label]="'Theme: ' + t.label"
          [attr.aria-pressed]="theme.theme() === t.id"
          class="h-6 w-6 rounded-full border border-border ring-offset-2 ring-offset-surface transition hover:scale-110"
          [class.ring-2]="theme.theme() === t.id"
          [class.ring-primary]="theme.theme() === t.id"
          [style.background]="swatch(t)"
        ></button>
      }
    </div>
  `,
})
export class ThemePicker {
  protected readonly themes = THEMES;
  protected readonly theme = inject(ThemeService);

  // Half-background / half-accent split so each theme reads as distinct at a glance.
  protected swatch(t: (typeof THEMES)[number]): string {
    return `linear-gradient(135deg, ${t.bg} 0 50%, ${t.accent} 50% 100%)`;
  }
}
