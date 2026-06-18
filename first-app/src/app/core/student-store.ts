import { inject } from '@angular/core';
import { signalStore, withState, withMethods } from '@ngrx/signals'
import { patchState } from '@ngrx/signals';
import { Student } from './student';

export const StudentStore = signalStore(
  { providedIn : 'root' },

  withState({
    students: [] as any[],
    loaded: false
  }),
  
  withMethods((store) => {
    const studentService = inject(Student);

    return {
      loadStudents() {
        if (store.loaded()) return; // if already loaded, no api call again

        studentService.getStudents().subscribe({
          next: (data: any) => {
            patchState(store, {students: data, loaded: true});
          },
          error: (err) => console.log('error loading students: ', err)
        })
      },

      addStudent(data: any) {
        studentService.addStudent(data).subscribe({
          next: (res: any) => {
            patchState(store, { students: [...store.students(), res.student] });
          },
          error: (err) => console.log('error adding student: ', err)
        });
      },

      updateStudent(id: string, data: any) {
        studentService.updateStudent(id, data).subscribe({
          next: (res: any) => {
            patchState(store, { students: store.students().map(s => s._id === id ? res.student : s)});
          },
          error: (err) => console.log('error updating student: ', err)
        })
      },

      deleteStudent(student: any) {
        studentService.deleteStudent(student._id).subscribe({
          next: () => {
            patchState(store, { students: store.students().filter(s => s._id !== student._id)});
          },
          error: (err) => {
            console.log('error deleting student: ', err);
          }
        })
      }
    }
  })
)