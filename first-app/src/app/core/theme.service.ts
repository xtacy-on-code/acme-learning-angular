import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'default' | 'dark' | 'ocean' | 'forest' | 'sunset';

/** The selectable themes, in display order. `bg`/`accent` drive the picker swatches. */
export const THEMES: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: 'default', label: 'Default', bg: '#ffffff', accent: '#4f46e5' },
  { id: 'dark', label: 'Dark', bg: '#1c1f26', accent: '#a78bfa' },
  { id: 'ocean', label: 'Ocean', bg: '#0d1f3c', accent: '#22d3ee' },
  { id: 'forest', label: 'Forest', bg: '#132a1a', accent: '#34d399' },
  { id: 'sunset', label: 'Sunset', bg: '#2a1810', accent: '#fb923c' },
];

const STORAGE_KEY = 'acme-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Source of truth. Initialized from localStorage so a saved choice survives reloads.
  readonly theme = signal<Theme>(this.readStored());

  constructor() {
    // Whenever the signal changes, reflect it onto <html data-theme> (which drives
    // all the CSS variables) and persist it. Runs once on construction too, so the
    // restored theme is applied on app load.
    effect(() => {
      const theme = this.theme();
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private readStored(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored && THEMES.some((t) => t.id === stored) ? stored : 'default';
  }
}
