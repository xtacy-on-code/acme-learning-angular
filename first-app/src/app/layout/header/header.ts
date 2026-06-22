import { Component, computed, inject } from '@angular/core';
import { ProfileStore } from '../../core/profile-store';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  store = inject(ProfileStore);

  private backendOrigin = 'http://localhost:5000';

  constructor() {
    // Safe to call even though the profile page also calls it — loadProfile()
    // is a no-op once loaded, and ProfileStore is a single shared (root)
    // instance, so both read the same `user` signal.
    this.store.loadProfile();
  }

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
