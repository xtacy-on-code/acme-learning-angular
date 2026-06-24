import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ProfileStore } from '../../core/profile-store';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  store = inject(ProfileStore);
  private router = inject(Router);

  private backendOrigin = 'http://localhost:5000';

  // The current page's title, shown on the left of the header. Kept in sync with
  // the active route so the header always reflects where you are.
  readonly pageTitle = signal(this.titleFor(this.router.url));

  constructor() {
    // Safe to call even though the profile page also calls it — loadProfile()
    // is a no-op once loaded, and ProfileStore is a single shared (root)
    // instance, so both read the same `user` signal.
    this.store.loadProfile();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.pageTitle.set(this.titleFor(e.urlAfterRedirects)));
  }

  private titleFor(url: string): string {
    if (url.startsWith('/students')) return 'Students';
    if (url.startsWith('/professors')) return 'Professors';
    if (url.startsWith('/gallery')) return 'Gallery';
    if (url.startsWith('/profile')) return 'Profile';
    if (url.startsWith('/home')) return 'Home';
    return 'Overview';
  }

  readonly userName = computed(() => this.store.user()?.name ?? '');

  // The logged-in user's role, shown as a badge in the header so it's always
  // clear whether you're acting as a professor or a student.
  readonly role = computed(() => this.store.user()?.role ?? '');

  // Same URL + cache-bust logic the profile page uses. Because we read the
  // shared signal, uploading a new photo on the profile page updates this
  // avatar automatically — no extra wiring needed.
  avatarUrl = computed(() => {
    const user = this.store.user();
    if (!user?.profileImage) return null;
    const stamp = user.updatedAt ? new Date(user.updatedAt).getTime() : '';
    return `${this.backendOrigin}${user.profileImage}?t=${stamp}`;
  });

  initial = computed(() => {
    const name = this.store.user()?.name ?? '';
    return name ? name.charAt(0).toUpperCase() : '?';
  });
}
