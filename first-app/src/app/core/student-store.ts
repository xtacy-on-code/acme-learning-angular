import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, switchMap, tap, catchError, pipe, EMPTY } from 'rxjs';
import { Student, StudentFilters } from './student';

interface Filters {
  grade: string;
  gender: string;
  email: string;
  phone: string;
  rollno: string;
}

export const StudentStore = signalStore(
  { providedIn: 'root' },

  withState({
    students: [] as any[],
    loaded: false,
    loading: false,
    page: 1,
    limit: 10,
    total: 0,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'asc' as 'asc' | 'desc',
    filters: {
      grade: '',
      gender: '',
      email: '',
      phone: '',
      rollno: ''
    } as Filters
  }),

  withMethods((store) => {
    const studentService = inject(Student);

    // Single source of truth for fetching. debounceTime coalesces rapid
    // calls (typing), switchMap cancels any in-flight request that's been
    // superseded by a newer one, so results never arrive out of order.
    const fetch = rxMethod<void>(
      pipe(
        debounceTime(300),
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          studentService
            .getStudents(store.page(), store.limit(), store.search(), store.filters(), store.sortBy(), store.sortOrder())
            .pipe(
              tap((data: any) =>
                patchState(store, {
                  students: data.students,
                  total: data.total,
                  loaded: true,
                  loading: false
                })
              ),
              catchError((err) => {
                console.log('error loading students:', err);
                patchState(store, { loading: false });
                return EMPTY; // keep the outer pipeline alive after an error
              })
            )
        )
      )
    );

    return {
      loadStudents() {
        if (store.loaded()) return;
        fetch();
      },

      setPage(page: number) {
        patchState(store, { page });
        fetch();
      },

      setSearch(search: string) {
        patchState(store, { search, page: 1 });
        fetch();
      },

      setFilter(key: string, value: string) {
        patchState(store, {
          filters: { ...store.filters(), [key]: value },
          page: 1
        });
        fetch();
      },

      setSort(column: string) {
        if (store.sortBy() === column) {
          patchState(store, { sortOrder: store.sortOrder() === 'asc' ? 'desc' : 'asc', page: 1 });
        } else {
          patchState(store, { sortBy: column, sortOrder: 'asc', page: 1 });
        }
        fetch();
      },

      clearAllFilters() {
        patchState(store, {
          search: '',
          page: 1,
          filters: { grade: '', gender: '', email: '', phone: '', rollno: '' }
        });
        fetch();
      },

      addStudent(data: any) {
        studentService.addStudent(data).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error adding student:', err)
        });
      },

      updateStudent(id: string, data: any) {
        studentService.updateStudent(id, data).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error updating student:', err)
        });
      },

      deleteStudent(student: any) {
        studentService.deleteStudent(student._id).subscribe({
          next: () => fetch(),
          error: (err) => console.log('error deleting student:', err)
        });
      }
    };
  })
);