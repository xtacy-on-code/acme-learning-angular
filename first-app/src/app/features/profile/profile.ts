import { Component, computed, effect, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ProfileStore } from '../../core/profile-store';

// A real email: non-empty local part, single @, a dotted domain with a 2+ char
// TLD. Stricter than Validators.email (which accepts e.g. "a@b").
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Phone: optional leading +, then 10–15 digits (covers local + country-code).
const PHONE_RE = /^\+?\d{10,15}$/;

// DOB must be a real date that's in the past and not absurdly old. Empty is
// allowed (the field is optional). Material's datepicker yields a Date.
function dobValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return { invalidDate: true };
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) return { futureDate: true };
  if (date < new Date(1900, 0, 1)) return { tooOld: true };
  return null;
}

// Class is `UserProfile` (not `Profile`) because the HTTP service in
// core/profile.ts is already called `Profile` — same way the service is
// `Student` and the page is `Students`.
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class UserProfile {
  store = inject(ProfileStore);

  // Where the backend serves files. The DB stores a relative path like
  // /uploads/profile-images/<id>.jpg, so we prefix it with the origin.
  private backendOrigin = 'http://localhost:5000';

  profileForm: FormGroup;

  // Bounds for the native date input (min/max want 'yyyy-mm-dd' strings). The
  // dobValidator still guards typed/edge values.
  readonly today = new Date().toISOString().slice(0, 10);
  readonly minDob = '1900-01-01';

  constructor(private fb: FormBuilder) {
    this.store.loadProfile();

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(EMAIL_RE)]],
      phone: ['', Validators.pattern(PHONE_RE)],
      bio: [''],
      dob: ['', dobValidator],
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
          // Native <input type="date"> binds a 'yyyy-mm-dd' string; the API sends ISO.
          dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : '',
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

  // Discard unsaved edits — re-apply the last loaded user values to the form.
  resetForm() {
    const user = this.store.user();
    if (!user) return;
    this.profileForm.reset({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      bio: user.bio ?? '',
      dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : '',
      address: user.address ?? '',
    });
  }

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
