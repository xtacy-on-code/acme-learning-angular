import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Route guard for role-restricted pages. Reads the allowed roles from the
// route's `data: { roles: [...] }` and the current role from localStorage
// (set at login). Allows if the role matches, else bounces to /students.
// Runs alongside authGuard (which is applied at the parent layout level).
export const roleGuard: CanActivateFn = (route) => {
  const allowed = (route.data?.['roles'] as string[]) ?? [];
  const role = localStorage.getItem('role');

  if (role && allowed.includes(role)) {
    return true;
  }

  inject(Router).navigate(['/students']);
  return false;
};
