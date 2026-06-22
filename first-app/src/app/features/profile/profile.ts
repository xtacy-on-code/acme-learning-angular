import { Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { ProfileStore } from '../../core/profile-store';

// Class is `UserProfile` (not `Profile`) because the HTTP service in
// core/profile.ts is already called `Profile` — same way the service is
// `Student` and the page is `Students`.
@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class UserProfile {
  store = inject(ProfileStore);

  // Where the backend serves files. The DB stores a relative path like
  // /uploads/profile-images/<id>.jpg, so we prefix it with the origin.
  private backendOrigin = 'http://localhost:5000';

  profileForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.store.loadProfile();

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      bio: [''],
      dob: [''],
      address: [''],
    });

    // The profile loads asynchronously, so we can't fill the form in the
    // constructor — the data isn't there yet. effect() re-runs whenever the
    // `user` signal changes, so the moment the GET resolves, we patch the form.
    effect(() => {
      const user = this.store.user();
      if (user) {
        this.profileForm.patchValue({
          name: user.name ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
          bio: user.bio ?? '',
          // Material's datepicker wants a Date object; the API sends an ISO string.
          dob: user.dob ? new Date(user.dob) : '',
          address: user.address ?? '',
        });
      }
    });
  }

  // Full image URL, or null when the user has no photo yet.
  // The `?t=updatedAt` is a cache-buster: the file is always named <userId>.<ext>,
  // so after re-uploading, the URL is identical and the browser would show the
  // OLD cached image. Changing the query string forces a fresh fetch.
  avatarUrl = computed(() => {
    const user = this.store.user();
    if (!user?.profileImage) return null;
    const stamp = user.updatedAt ? new Date(user.updatedAt).getTime() : '';
    return `${this.backendOrigin}${user.profileImage}?t=${stamp}`;
  });

  // First letter of the name, shown when there's no photo.
  initial = computed(() => {
    const name = this.store.user()?.name ?? '';
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.store.uploadImage(file);
    }
    // Reset so selecting the same file again still fires the change event.
    input.value = '';
  }

  handleSubmit() {
    if (this.profileForm.valid) {
      this.store.updateProfile(this.profileForm.value);
    }
  }
}
