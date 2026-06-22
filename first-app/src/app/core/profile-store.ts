import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Profile } from './profile';

// Same @ngrx/signals shape as StudentStore, but simpler: there's only ever one
// record (the logged-in user), so no pagination/search/debounce. We use plain
// .subscribe() like StudentStore's addStudent/updateStudent methods.
//
// providedIn: 'root' makes this a single shared instance. That's why the
// profile page and the header avatar both see the same `user` signal — update
// it in one place and everything reading it re-renders automatically.
export const ProfileStore = signalStore(
  { providedIn: 'root' },

  withState({
    user: null as any,
    loaded: false,
    loading: false,
    saving: false,
    uploading: false,
  }),

  withMethods((store) => {
    const profileService = inject(Profile);

    return {
      loadProfile() {
        if (store.loaded()) return; // already have it — don't refetch
        patchState(store, { loading: true });
        profileService.getProfile().subscribe({
          next: (data: any) =>
            patchState(store, { user: data.user, loaded: true, loading: false }),
          error: (err) => {
            console.log('error loading profile:', err);
            patchState(store, { loading: false });
          },
        });
      },

      updateProfile(data: any) {
        patchState(store, { saving: true });
        profileService.updateProfile(data).subscribe({
          next: (res: any) => patchState(store, { user: res.user, saving: false }),
          error: (err) => {
            console.log('error updating profile:', err);
            patchState(store, { saving: false });
          },
        });
      },

      uploadImage(file: File) {
        patchState(store, { uploading: true });
        profileService.uploadImage(file).subscribe({
          next: (res: any) => patchState(store, { user: res.user, uploading: false }),
          error: (err) => {
            console.log('error uploading image:', err);
            patchState(store, { uploading: false });
          },
        });
      },
    };
  })
);
