import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { tap } from 'rxjs';
import { Professor } from './professor';

// Same @ngrx/signals shape as StudentStore, but simpler: there's no live search,
// so no rxMethod/debounce/switchMap pipeline — just plain .subscribe(). The grid
// handles sort/filter/pagination client-side, so we hold the full list and
// refetch it after every mutation. providedIn: 'root' = single shared instance.
export const ProfessorStore = signalStore(
  { providedIn: 'root' },

  withState({
    professors: [] as any[],
    loaded: false,
    loading: false,
  }),

  withMethods((store) => {
    const service = inject(Professor);

    // Always refetches (unlike loadProfessors, which is a no-op once loaded) —
    // called after add/update/delete to reflect the change.
    const fetch = () => {
      patchState(store, { loading: true });
      service.getProfessors().subscribe({
        next: (data: any) =>
          patchState(store, { professors: data.professors, loaded: true, loading: false }),
        error: (err) => {
          console.log('error loading professors:', err);
          patchState(store, { loading: false });
        },
      });
    };

    return {
      loadProfessors() {
        if (store.loaded()) return;
        fetch();
      },

      // Reset on logout — see StudentStore.reset for the rationale.
      reset() {
        patchState(store, { professors: [], loaded: false, loading: false });
      },

      addProfessor(data: any) {
        service.addProfessor(data).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error adding professor:', err),
        });
      },

      updateProfessor(id: string, data: any) {
        service.updateProfessor(id, data).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error updating professor:', err),
        });
      },

      // Inline single-field update (one cell commit). Returns the Observable so
      // the caller can show a "Saved"/error toast and revert the grid on failure.
      // On success we patch just that row in place (no full refetch); on error we
      // patch nothing, leaving the caller to roll the cell back to its old value.
      updateField(id: string, field: string, newValue: any) {
        return service.updateProfessor(id, { [field]: newValue }).pipe(
          tap(() =>
            patchState(store, {
              professors: store
                .professors()
                .map((p) => (p._id === id ? { ...p, [field]: newValue } : p)),
            })
          )
        );
      },

      deleteProfessor(professor: any) {
        service.deleteProfessor(professor._id).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error deleting professor:', err),
        });
      },

      bulkDeleteProfessors(ids: string[]) {
        service.bulkDeleteProfessors(ids).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error bulk-deleting professors:', err),
        });
      },
    };
  })
);
