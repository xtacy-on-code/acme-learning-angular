# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout (read this first)

This repo contains two self-contained projects under one git root:

- `first-app/` — the Angular 21 frontend (`core/ features/ layout/ shared/` source tree).
  It has its own `package.json` and `node_modules`; run all frontend commands from here.
- `backend/` — Express 5 + Mongoose REST API the frontend talks to (its own `package.json`).

There is no npm project at the repo root — only shared editor config (`.prettierrc`,
`.editorconfig`, `.vscode/`) lives there. (A duplicate old flat-layout Angular app once sat
at the root; it was deleted once `first-app/` superseded it. If you see references to a root
`src/`/`angular.json`, they're stale.)

Note: `first-app` depends on `@ngrx/signals` — make sure it stays declared in
`first-app/package.json` and installed in `first-app/node_modules`. It must resolve from the
same place as `@angular/core`; a second Angular copy elsewhere causes `rxMethod()` NG0203
"injection context" crashes that blank every store-backed page.

## Commands

Frontend — run from `first-app/`:

```bash
npm start          # ng serve, dev server on http://localhost:4200
npm run build      # production build into first-app/dist
npm test           # unit tests via Vitest (@angular/build:unit-test builder)
npm run watch      # development build, rebuild on change
ng generate component features/<name>   # scaffold (prefix: app)
```

Backend — run from `backend/` (no `start` script is defined):

```bash
npx nodemon index.js   # dev with auto-reload (nodemon is a devDependency)
node index.js          # plain run
```

The backend needs `backend/.env` with `MONGODB_URI`, `JWT_SECRET`, and optional `PORT`
(defaults to 5000). To run the full app locally, start MongoDB, the backend, then the
frontend — the frontend hardcodes the API at `http://localhost:5000`.

## Architecture

### Frontend (`first-app/src/app`)

Standalone components throughout (no NgModules). `app.config.ts` wires the router, the
native date adapter (Angular Material), and `provideHttpClient(withInterceptors([authInterceptor]))`.

- **State: `core/student-store.ts`** is the heart of the app — an `@ngrx/signals`
  `signalStore` (`providedIn: 'root'`) holding the student list plus pagination, search,
  filters, and sort state. There is a single private `fetch` (`rxMethod`) with
  `debounceTime(300)` + `switchMap`, so every list operation (`setPage`, `setSearch`,
  `setFilter`, `setSort`, `clearAllFilters`, and the mutation methods) just patches state
  and calls `fetch()`. This is the only place that triggers a list reload — components
  call store methods, not the HTTP service, and read state via signals. `loadStudents()`
  is a no-op once `loaded` is true.
- **HTTP services: `core/auth.ts`, `core/student.ts`** are thin wrappers over `HttpClient`.
  `Student.getStudents(...)` serializes pagination/search/sort plus a `StudentFilters`
  object (empty values omitted) into query params. The store, not components, consumes these.
- **Auth flow:** login stores the JWT in `localStorage` under `token`. `core/auth-interceptor.ts`
  attaches it as `Authorization: Bearer <token>` on every request; `core/auth-guard.ts`
  blocks routes when no token is present and redirects to `/login`.
- **Routing (`app.routes.ts`):** `/login` and `/signup` are public; everything else nests
  under `MainLayout` behind `authGuard`. `''` redirects to `login`.
- **Layout vs features vs shared:** `layout/` holds chrome (header, footer, sidebar,
  main-layout), `features/` holds routed pages (home, login, signup, students), and
  `shared/data-table` is the reusable table used to render students.

### Backend (`backend`)

`index.js` boots Express, connects Mongoose to `MONGODB_URI`, and mounts two routers:

- `POST /api/auth/signup`, `POST /api/auth/login` (`src/routes/auth.js`) — bcrypt password
  hashing, JWT (`{ userId }`, 7-day expiry) signed with `JWT_SECRET`.
- `/api/students` CRUD (`src/routes/student.js`) — all guarded by `src/middleware/auth.js`,
  which verifies the Bearer token and sets `req.user`. The `GET` handler does
  server-side pagination (`page`/`limit`, capped at 100), case-insensitive `$regex` search
  across name/email/phone/rollno, exact-match filters for grade/gender (gender lowercased
  to match the schema enum), partial `$regex` filters for rollno/phone/email, and sorting
  restricted to an `ALLOWED_SORT_FIELDS` allowlist. The frontend store's query shape mirrors
  this contract exactly — keep them in sync when changing either side.

Models: `src/models/User.js`, `src/models/Student.js` (Mongoose schemas with `timestamps`).

## Conventions

- Prettier: 100-col, single quotes; HTML uses the `angular` parser (`.prettierrc`).
- Component class names are PascalCase with no suffix (e.g. `Students`, `MainLayout`,
  `StudentStore`), matching Angular 21 CLI defaults; the component selector prefix is `app`.
- Tests are Vitest `.spec.ts` files colocated with their component/service.
