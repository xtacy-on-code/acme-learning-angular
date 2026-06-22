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

- **State lives in `@ngrx/signals` stores under `core/`**, all `providedIn: 'root'`
  (single shared instances). Components call store methods and read state via signals;
  they don't talk to the HTTP services directly.
  - **`core/student-store.ts`** is the heart of the list UI — holds the student list plus
    pagination, search, filters, and sort state. A single private `fetch` (`rxMethod`) with
    `debounceTime(300)` + `switchMap` means every list operation (`setPage`, `setSearch`,
    `setFilter`, `setSort`, `clearAllFilters`, and the mutation methods) just patches state
    and calls `fetch()` — the only place that triggers a reload. `loadStudents()` is a no-op
    once `loaded` is true.
  - **`core/profile-store.ts`** holds the single logged-in user (`user`, plus `loaded`/
    `loading`/`saving`/`uploading` flags). Simpler than StudentStore — no `rxMethod`, just
    plain `.subscribe` in `loadProfile`/`updateProfile`/`uploadImage`. Because it's a root
    singleton, the profile page and the header avatar read the *same* `user` signal, so an
    edit or photo upload updates both with no extra wiring.
- **HTTP services: `core/auth.ts`, `core/student.ts`, `core/profile.ts`** are thin wrappers
  over `HttpClient`. `Student.getStudents(...)` serializes pagination/search/sort plus a
  `StudentFilters` object (empty values omitted) into query params. `Profile.uploadImage(file)`
  posts a `FormData` (multipart) — never set `Content-Type` by hand, the browser adds the
  boundary. The stores, not components, consume these.
- **Auth flow:** login stores the JWT in `localStorage` under `token`. `core/auth-interceptor.ts`
  attaches it as `Authorization: Bearer <token>` on every request; `core/auth-guard.ts`
  blocks routes when no token is present and redirects to `/login`.
- **Routing (`app.routes.ts`):** `/login` and `/signup` are public; `students`, `home`, and
  `profile` nest under `MainLayout` behind `authGuard`. `''` redirects to `login`.
- **Layout vs features vs shared:** `layout/` holds chrome (header, footer, sidebar,
  main-layout), `features/` holds routed pages (home, login, signup, students, profile), and
  `shared/data-table` is the reusable table used to render students. The `Header` derives its
  title from the active route (`Router` `NavigationEnd`) and shows the current user's
  avatar/name from `ProfileStore`. `DataTable` takes a `loading` input and renders three states:
  skeleton rows while loading, a centered empty state when there are no rows, else the table.
- **Class-name gotcha:** the profile HTTP service is `Profile` (`core/profile.ts`); the
  routed page component is therefore `UserProfile` (`features/profile/profile.ts`, selector
  `app-profile`) to avoid colliding with it — same way the service is `Student` and the
  page is `Students`.

### Theming & UI (design system)

The app ships 5 user-switchable themes (Default, Dark, Ocean, Forest, Sunset) built on **CSS
custom properties + Tailwind v4** — deliberately **not** the Angular Material SCSS theming system.

- **`src/styles.css` is the single source of theme truth.** Each `[data-theme]` block defines a
  raw `--c-*` ramp (`--c-background` darkest → `--c-surface` → `--c-surface-hover` lightest, plus
  `--c-primary` / `--c-primary-hover` / `--c-on-primary` / `--c-text` / `--c-muted` / `--c-border`
  and a `--c-shadow`). `@theme inline { --color-surface: var(--c-surface); … }` maps those into
  Tailwind's color namespace, so utilities (`bg-surface`, `text-primary`, `border-border`,
  `text-muted`, `text-on-primary`, etc.) resolve to the vars **at runtime** — flipping
  `data-theme` on `<html>` re-colors everything instantly. There's also a `@utility shadow-card`
  driven by `--c-shadow`.
- **Material follows the same vars.** A `:root` block remaps `--mat-sys-*` tokens to the `--c-*`
  vars so the Material table/paginator/dialog/form-fields and **filled buttons** (`mat-flat-button
  color="primary"` → `--mat-sys-primary` bg + `--mat-sys-on-primary` text) track the theme. If you
  change a theme's colors, this mapping already flows through — no per-component work.
- **`core/theme.service.ts`** holds `theme = signal<Theme>()`, initialized from `localStorage`
  (`acme-theme`); an `effect()` writes `data-theme` onto `<html>` and persists on change.
  `THEMES` (id/label/bg/accent) drives the **`shared/theme-picker`** swatches in the sidebar.
  `App` injects the service so the theme applies app-wide (incl. login/signup); `index.html` has a
  tiny inline script that sets `data-theme` before first paint to avoid a flash — **leave it.**
- **Styling rules:** never hardcode hex in templates/component CSS — use the semantic Tailwind
  classes or `var(--c-*)`. Keep the `--c-*` names and the `@theme inline` structure stable; add a
  new token in all five `[data-theme]` blocks + the `@theme inline` map together. The look targets
  a clean, minimal SaaS dashboard (Linear/Vercel): page title `text-2xl font-bold` + `text-sm
  text-muted` subtitle, cards `border border-border … shadow-card`, no gradients/heavy color.

### Backend (`backend`)

`index.js` boots Express, connects Mongoose to `MONGODB_URI`, serves the `uploads/` folder
as static files (`app.use('/uploads', express.static(...))`), and mounts three routers:

- `POST /api/auth/signup`, `POST /api/auth/login` (`src/routes/auth.js`) — bcrypt password
  hashing, JWT (`{ userId }`, 7-day expiry) signed with `JWT_SECRET`.
- `/api/students` CRUD (`src/routes/student.js`) — all guarded by `src/middleware/auth.js`,
  which verifies the Bearer token and sets `req.user` (`= { userId }`). The `GET` handler does
  server-side pagination (`page`/`limit`, capped at 100), case-insensitive `$regex` search
  across name/email/phone/rollno, exact-match filters for grade/gender (gender lowercased
  to match the schema enum), partial `$regex` filters for rollno/phone/email, and sorting
  restricted to an `ALLOWED_SORT_FIELDS` allowlist. The frontend store's query shape mirrors
  this contract exactly — keep them in sync when changing either side.
- `/api/profile` (`src/routes/profile.js`, `auth`-guarded) — the current user's own profile:
  `GET` returns `User.findById(req.user.userId).select('-password')`; `PUT` updates only a
  whitelist (`name/email/phone/bio/dob/address`, with empty `dob` coerced to `null`) and maps
  a duplicate-email index error to `400`; `POST /image` runs the multer upload middleware and
  stores the resulting path on `profileImage`.

**Image uploads** use `src/middleware/upload.js` — multer `diskStorage` writing to
`backend/uploads/profile-images/<userId><ext>` (one file per user, overwritten on re-upload),
an image-only `fileFilter`, and a 2 MB size limit. The DB stores only the URL *path*
(`/uploads/profile-images/...`), never the bytes; the file is reachable via the static mount
above. `backend/uploads/` and `.env` are gitignored (`backend/.gitignore`).

Models: `src/models/User.js` (`name`, `email` [unique], `password`, plus profile fields
`profileImage`, `phone`, `bio`, `dob`, `address`), `src/models/Student.js`. Both use
`timestamps`. Profile-image URLs are cache-busted on the frontend with `?t=<updatedAt>` since
the filename is stable per user.

## Conventions

- Prettier: 100-col, single quotes; HTML uses the `angular` parser (`.prettierrc`).
- Component class names are PascalCase with no suffix (e.g. `Students`, `MainLayout`,
  `StudentStore`), matching Angular 21 CLI defaults; the component selector prefix is `app`.
- Styling is Tailwind v4 utilities with the **semantic theme classes only** (`bg-surface`,
  `text-text`, `text-muted`, `border-border`, `bg-primary`, `text-on-primary`, …) — no hardcoded
  hex in templates or component CSS (component CSS may use `var(--c-*)`). See "Theming & UI".
- Tests are Vitest `.spec.ts` files colocated with their component/service.
