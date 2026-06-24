import { HttpErrorResponse } from '@angular/common/http';

// Turn an HttpClient error into a human-friendly message. Prefers the backend's
// own `{ details }` / `{ error }` JSON, then falls back to status-specific hints
// (status 0 = unreachable; 404 = route missing, usually a backend not restarted
// after a route was added) before a generic message.
export function bulkErrorMessage(err: unknown): string {
  const e = err as HttpErrorResponse | undefined;
  const body = e?.error;
  if (body && typeof body === 'object') {
    if (body.details) return body.details;
    if (body.error) return body.error;
  }
  if (e?.status === 0) return 'Cannot reach the server — is the backend running?';
  if (e?.status === 404) {
    return 'Endpoint not found (404). Restart the backend so it loads the latest routes.';
  }
  return e?.message || 'Request failed';
}
