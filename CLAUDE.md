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
"injection context" crashes that blank every store-backed page. It also depends on
`ag-grid-community` + `ag-grid-angular` (v35), used only by `shared/ag-data-table` (Professors).

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

The backend needs `backend/.env` with `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL` (defaults
to `redis://localhost:6379` if unset), and optional `PORT` (defaults to 5000). To run the
full app locally, start MongoDB and Redis, then the backend, then the frontend — the
frontend hardcodes the API at `http://localhost:5000`. `index.js` awaits `redisClient.connect()`
before `app.listen`, so the server won't start if Redis is unreachable.

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
    once `loaded` is true. The `filters` state still has `rollno`/`phone`/`email` fields and the
    backend still honors them, but the **Students toolbar UI exposes only search + grade + gender**
    (the dedicated roll-no/phone inputs were removed — the main search already regex-matches
    name/email/phone/rollno, so they were redundant).
  - **`core/profile-store.ts`** holds the single logged-in user (`user`, plus `loaded`/
    `loading`/`saving`/`uploading` flags). Simpler than StudentStore — no `rxMethod`, just
    plain `.subscribe` in `loadProfile`/`updateProfile`/`uploadImage`. Because it's a root
    singleton, the profile page and the header avatar read the *same* `user` signal, so an
    edit or photo upload updates both with no extra wiring. `user.role` (`student`|`professor`)
    drives role-gated UI (the sidebar Professors link, the Students read-only toggle).
  - **`core/professor-store.ts`** mirrors StudentStore but simpler — no `rxMethod`/debounce
    (there's no live search; the AG Grid does sort/filter/page client-side), so it holds the
    full list (`professors`, `loaded`, `loading`) and refetches it wholesale after each mutation.
  - **Cross-user gotcha — reset stores on logout.** All three stores are root singletons whose
    `load*()` methods are **no-ops once `loaded` is true**. So logging out and back in as a
    different user (an SPA navigation, no page reload) would otherwise leave the *previous*
    user's cached profile/data in place. Each store therefore exposes a `reset()` that
    `patchState`s back to initial, and `Sidebar.logout()` calls `reset()` on
    `ProfileStore`/`StudentStore`/`ProfessorStore` (plus clearing `token`/`role` from
    `localStorage`). If you add a new root store with cached per-user state, reset it here too.
- **HTTP services: `core/auth.ts`, `core/student.ts`, `core/profile.ts`, `core/professor.ts`**
  are thin wrappers over `HttpClient`. `Student.getStudents(...)` serializes pagination/search/sort
  plus a `StudentFilters` object (empty values omitted) into query params; `Professor.getProfessors()`
  takes no params (full list — the grid filters client-side). `Profile.uploadImage(file)`
  posts a `FormData` (multipart) — never set `Content-Type` by hand, the browser adds the
  boundary. The stores, not components, consume these.
- **Auth flow & roles:** login stores the JWT in `localStorage` under `token` **and the role
  under `role`** (returned top-level by `/api/auth/login`, not just embedded in the JWT, so the
  frontend has it synchronously at login). `core/auth-interceptor.ts` attaches the token as
  `Authorization: Bearer <token>` on every request; `core/auth-guard.ts` blocks routes when no
  token is present and redirects to `/login`. Roles aren't gated at the route level — access is
  enforced in-component (UI) and by the backend (`requireRole`). Two role sources coexist by design:
  the **JWT role** (enforced by the backend) and the **`ProfileStore.user().role`** from
  `/api/profile` (drives reactive UI like the role badge and the read-only toggles); a copy is also
  kept in `localStorage` under `role`. All are set/refreshed at login — tokens issued before roles
  existed lack one, so those users must re-login. The **login/signup screens** are a branded
  centered card over a radial-gradient backdrop (brand mark + heading); on signup the `role` control
  is picked via **two selectable cards** (`roleOptions` + `selectRole()` in `signup.ts`), not Material
  radio buttons.
- **Routing (`app.routes.ts`):** `/login` and `/signup` are public; `students`, `home`,
  `professors`, `gallery`, and `profile` nest under `MainLayout` behind `authGuard`. `''` redirects to
  `login`. `professors`, `home`, and `gallery` are **lazy-loaded** (`loadComponent`) so each ships in
  its own chunk. `professors` is lazy so AG Grid ships in its own chunk (see below);
  it's open to any logged-in user (read-only for students) — role isn't gated at the route level,
  only in-component. Each route
  carries a `title` string (e.g. `'Students · Acme'`) — Angular Router's native `TitleStrategy`
  sets the browser-tab title on every navigation (no `Title` service or custom strategy). This is
  separate from `header.ts`'s `pageTitle()`/`pageSubtitle()` signals, which drive the **header's**
  `<h1>` + subtitle (feature pages no longer render their own heading). `index.html`
  keeps a neutral `<title>Acme</title>` fallback that the Router overrides on navigation.
- **Gallery (`features/gallery`, route `/gallery`, lazy-loaded, sidebar link for all users).** A
  simple scrollable photo gallery — a **CSS-columns masonry** (`columns-1 → sm:2 → lg:3 → xl:4` with
  `break-inside-avoid` cards) of themed sample images, each with a category pill (Campus / Students /
  Faculty / Events) and a caption that slides up on hover. The component holds a static `images[]`
  array; **photos are placeholders** sourced from **LoremFlickr** keyword URLs (`loremflickr.com/
  <w>/<h>/<keyword>?lock=<n>` — `lock` pins a stable image) with an `(error)` → Lorem Picsum
  fallback so a tile never shows a broken image. Keywords are intentionally **object/place oriented**
  (`books`, `building`, `laptop`, `research`, `technology`, `school`, `sports`, `city`, `desk`) —
  people-heavy tags (`concert`/`music`/`exam`/…) returned irrelevant **or unsuitable** photos and are
  avoided; LoremFlickr is also flaky (keywords intermittently 500), hence the fallback. Meant to be
  swapped for real campus photos later (e.g. files under `first-app/public/` or a proper upload flow).
- **Layout vs features vs shared:** `layout/` holds chrome (header, footer, sidebar,
  main-layout), `features/` holds routed pages (home, login, signup, students, professors,
  gallery, profile), and `shared/data-table` (Material) + `shared/ag-data-table` (AG Grid) are the two
  reusable tables. The `Header` derives its
  title from the active route (`Router` `NavigationEnd`) — a `pageTitle()` signal plus a
  `pageSubtitle()` companion shown beneath it — and shows the current user's avatar/name (with a
  small role-badge chip) from `ProfileStore`; it's `sticky` with a backdrop blur. **The feature
  pages no longer carry their own `<h1>`** — the header is the single place the page title/subtitle
  appear, so each routed page starts straight at its content/toolbar. `main-layout` centers the
  routed content in a `max-w-[1280px]` column; the `sidebar` marks the active nav link with a
  `bg-primary/10 text-primary` **pill** (not a left border). `DataTable` takes a `loading` input and
  renders three states: skeleton rows while loading, a centered empty state when there are no rows,
  else the table.
  `shared/chart` (`ChartComponent`, selector `app-chart`) is a thin reusable wrapper over
  **Chart.js** (the lib is used directly — no `ng2-charts` — to avoid Angular-version peer-dep
  conflicts): it takes a `config` **signal input** (a Chart.js `ChartConfiguration`) and an
  `effect()` (re)creates the chart on a `<canvas>` whenever the config changes, destroying the
  prior instance first (and in `ngOnDestroy`) to avoid canvas leaks. The **home dashboard** uses
  it for a gender doughnut + grade-distribution bar chart; because canvas can't read CSS classes,
  `Home` builds each `config` as a `computed()` that depends on both `StudentStore.stats()` and
  `ThemeService.theme()` and reads `--c-*` colors via `getComputedStyle` — so a theme switch
  recomputes the config and redraws the chart in the new palette. The `home` route is
  **lazy-loaded** (`loadComponent` in `app.routes.ts`) so Chart.js ships in the dashboard's own
  chunk rather than the initial bundle. Note `loadStats()` does `patchState(store, { stats: data })`
  — a **wholesale replace** of the `stats` object, so any field the `/stats` payload omits (e.g. a
  stale Redis cache from before `byGrade` existed) becomes `undefined`; the grade config defends
  with `byGrade ?? []` before sorting/mapping.
- **Class-name gotcha:** the profile HTTP service is `Profile` (`core/profile.ts`); the
  routed page component is therefore `UserProfile` (`features/profile/profile.ts`, selector
  `app-profile`) to avoid colliding with it — same way the service is `Student` and the
  page is `Students` (and the service is `Professor`, the page `Professors`).
- **Role-gated UI (no new UX, just show/hide):** the **Professors** nav link shows for every
  logged-in user (students can view the list). Both `Students` and `Professors` expose a
  `canManage = computed(() => profileStore.user()?.role === 'professor')` that gates their write
  controls and the "+ Add …" button — so a student sees a **read-only** table. The two pages differ
  in *how* they edit: `Students` binds `canManage` to the Material DataTable's `[showEdit]`/
  `[showDelete]` (dialog-based edit/delete; the `actions` column only renders when
  `showEdit || showDelete`); `Professors` has **no edit button** (`showEdit` is `false`) — editing is
  inline in the grid, gated by `[editable]="canManage()"` — and keeps only Delete (`[showDelete]`).
  The header shows the current user's `role` as a small badge under the name (`header.ts`'s `role`
  computed) so it's always clear who you're acting as. All of this is **UI convenience only**; the
  backend independently enforces the rules (a student hitting any write API — students or professors
  — gets 403), so never rely on the hidden controls for security.
- **`shared/ag-data-table` (AG Grid wrapper) & the Professors feature:** `AgDataTable`
  (`shared/ag-data-table/ag-data-table.ts`, selector `app-ag-data-table`) is a reusable wrapper over
  **AG Grid** (`ag-grid-community` + `ag-grid-angular`, v35) used by the Professors page instead of
  the Material `DataTable` — a deliberate second-library showcase. It mirrors DataTable's API
  (`columns: DataTableColumn[]`, `data`, `loading`, `showEdit`/`showDelete` inputs; `editClicked`/
  `deleteClicked` outputs) so callers swap with minimal change, plus inline-edit extras (below).
  Notable bits, **all easy to get wrong**: (1) `ModuleRegistry.registerModules([AllCommunityModule])`
  is a **module-level side effect at the top of `ag-data-table.ts`** (not `main.ts`) so AG Grid lands
  in the lazy Professors chunk, not the initial bundle — same reasoning as lazy-loading Home for
  Chart.js. (2) Theming uses the modern **Theming API** (`themeQuartz.withParams({...})` from
  `ag-grid-community`, **not** the legacy CSS theme files), with color params set to `var(--c-*)`
  strings (`backgroundColor`, `foregroundColor`, `headerBackgroundColor`, `borderColor`,
  `rowHoverColor`, `accentColor`, …) — so the grid recolors on a `data-theme` flip with **zero JS**,
  the same way the `--mat-sys-*` remap themes Material. (3) The grid uses **`domLayout="autoHeight"`**
  — AG Grid otherwise needs an explicit pixel height and renders **blank** in a flex/`h-full` parent
  whose height doesn't resolve; autoHeight sizes it to its rows instead. (4) The actions column is a
  custom cell renderer (`actions-cell.ts`, `ICellRendererAngularComp`) that calls back via
  `params.context.componentParent.onEdit/onDelete`, which re-emit the wrapper's outputs. Sorting and
  pagination are AG Grid's built-in client-side features (`pagination`, `paginationPageSize`).
- **Inline cell editing (Professors).** `DataTableColumn` carries optional `editable` /
  `editorType: 'text'|'number'|'select'` / `editorParams: { values }`, mapped to AG Grid's `editable`
  + built-in editors (text default, `agNumberCellEditor`, `agSelectCellEditor`). A master
  `editable` input gates all of it (bound to `canManage()` so students stay read-only). Double-click
  to edit (default — **don't** set `singleClickEdit`); committing fires `(cellValueChanged)` →
  the wrapper's **`cellEdited`** output `{ id, field, oldValue, newValue }` (skipped when unchanged).
  `[getRowId]` is keyed on `_id` (not row index) — **required** so `revertCell(rowId, field, oldValue)`
  (which calls `gridApi.getRowNode(rowId).setDataValue(...)`) can find the node. The Professors page
  handles `cellEdited` → `ProfessorStore.updateField(id, field, newValue)` (sends **only that field**;
  the backend `PUT /:id` does a partial `findByIdAndUpdate` with `runValidators`, leaving other fields
  intact). It's **optimistic**: on success a brief `MatSnackBar` "Saved" + an in-place row patch (no
  refetch); on failure `revertCell(...)` rolls the cell back and an error snackbar shows the server's
  `err.error.details`. Every column is editable; `employeeId` has a unique index, so editing it to a
  duplicate fails server-side and reverts. There is **no dialog-based edit button** on Professors
  (inline editing replaces it) — only Add + Delete; `showEdit` is `false`. (Students' Material table
  still uses the dialog edit via `DataTable`.)
- **Rich cells (both tables).** `DataTableColumn` carries an optional `cellType:
  'user'|'mono'|'pill'|'genderBadge'|'designationBadge'|'text'` (+ `secondaryKey` for the `user`
  cell's second line) so a column renders as an avatar-initials + name/email block (`user`),
  monospace text (`mono`, for IDs/roll/phone), a neutral chip (`pill`, e.g. grade), or a colored
  badge (`genderBadge`/`designationBadge`). Both wrappers honor the **same** `cellType`: the
  Material `DataTable` switches in its cell template (with `initials()`/`genderBadgeClass()` helpers
  in `data-table.ts`); the AG Grid wrapper maps it to cell renderers — `user-cell.ts` and
  `badge-cell.ts` (new `ICellRendererAngularComp`s alongside `actions-cell.ts`), or `cellClass:
  'font-mono'` for `mono`. **Renderers coexist with inline editing** — a column can be both
  `editable` and a `…Badge`: double-click swaps in the editor, commit recreates the cell (the
  renderers `refresh() => false`). Students fold `email` into the name's `user` cell (no separate
  Email column); Professors keep all columns but render name as `user`, employeeId/phone as `mono`,
  designation/gender as badges. The AG theme (`acmeGridTheme`) sets extra params now (Inter
  `fontFamily`, `headerBackgroundColor: var(--c-surface-2)`, taller `rowHeight`, `wrapperBorder:
  false` since the page card supplies the border/radius).
- **Multi-select + bulk delete (both tables).** Both tables take a `selectable` input (bound to
  `canManage()`) and emit `selectionChanged` with the selected row objects. `DataTable` (Material)
  renders a leading checkbox column via CDK `SelectionModel` + `MatCheckbox` (header select-all +
  per-row) and **clears the selection in `ngOnChanges` whenever `data` changes** — important because
  Students is server-paginated, so a page change/reload/delete replaces the array and a stale
  selection would reference unseen rows (select-all = current page only). `AgDataTable` uses AG Grid's
  modern `rowSelection = { mode: 'multiRow', checkboxes: true, headerCheckbox: true,
  enableClickSelection: false }` (click-to-select off so double-click cell editing still works);
  since the grid is client-side, its selection persists across grid pages. Each page keeps the
  selected rows, shows a "N selected → Delete selected" toolbar (professor-only, with a `confirm()`),
  and calls the store's `bulkDelete*` → service `POST /bulk-delete { ids }`. After the delete the
  store refetches and the table's data-change clears the selection.
- **Bulk EDIT panel + "just changed" flash (both tables).** When ≥1 row is selected, a **slim
  bar** appears below the page heading (gated by `canManage() && selected.length`) showing
  "N students/professors selected" plus the bulk-delete + a **set-same-value** control: Students
  edit **grade + gender**, Professors edit **department + designation** (each is *"leave blank =
  don't change"*, so only the filled fields are applied). Apply calls the store's
  `bulkUpdate*(ids, update)` → service `POST /bulk-update { ids, update }`; the backend does one
  `updateMany($set)` so every selected row ends up identical on the edited fields. The store update
  is **optimistic + in-place** (patches the matched rows with `...update`, *not* a full refetch —
  same pattern as `updateField`) so the rows stay put and can be flashed. The page subscribes with
  `finalize(() => applying = false)` (button never sticks on "Applying…") and toasts via the shared
  **`core/http-error.ts` `bulkErrorMessage(err)`** helper, which surfaces the backend's
  `{ details }`/`{ error }` or a status-specific hint (status 0 = server down; **404 = route missing,
  usually a backend not restarted after the route was added**). On success the changed rows **flash**
  then fade back: Professors use AG Grid's built-in `flashRows(ids)` wrapper method
  (`gridApi.flashCells({ rowNodes, flashDuration, fadeDuration })`); Students use a `highlightIds`
  input on `DataTable` that toggles a `.row-flash` class driving a `@keyframes rowFlash` CSS
  animation (tinted with `--c-primary`, fading to transparent), cleared after ~1.9s. The whitelist of
  bulk-editable fields lives **server-side** in each route (`['grade','gender']` /
  `['department','designation']`) — extend both the panel UI and that allowlist together.

### Theming & UI (design system)

The app ships 5 user-switchable themes (Default, Dark, Ocean, Forest, Sunset) built on **CSS
custom properties + Tailwind v4** — deliberately **not** the Angular Material SCSS theming system.

- **`src/styles.css` is the single source of theme truth.** Each `[data-theme]` block defines a
  raw `--c-*` ramp: surfaces `--c-background` darkest → `--c-surface` → `--c-surface-2` (subtle
  fill: table headers, chips, kbd) → `--c-surface-hover` (hover/elevation), plus `--c-primary` /
  `--c-primary-hover` / `--c-on-primary`, text `--c-text` → `--c-muted` → `--c-faint` (tertiary:
  captions, placeholders), borders `--c-border` (hairline) / `--c-border-strong` (inputs/controls),
  and a `--c-shadow`. `@theme inline { --color-surface: var(--c-surface); … }` maps those into
  Tailwind's color namespace, so utilities (`bg-surface`, `bg-surface-2`, `text-primary`,
  `border-border`, `border-border-strong`, `text-muted`, `text-faint`, `text-on-primary`, etc.)
  resolve to the vars **at runtime** — flipping `data-theme` on `<html>` re-colors everything
  instantly. There's also a `@utility shadow-card` driven by `--c-shadow`. **When adding a token,
  add it to all five `[data-theme]` blocks AND the `@theme inline` map together.** The **Default**
  theme is a cool zinc-gray (bg `#f7f7f8`, white cards); the other four stay dark. **Typography:** a
  separate `@theme { --font-sans: 'Inter'…; --font-mono: 'JetBrains Mono'… }` block sets Tailwind's
  `font-sans`/`font-mono`; the fonts are loaded via `<link>` in `index.html` and `body` is Inter.
  Use `font-mono` for IDs/roll numbers/phones.
- **Material follows the same vars.** A `:root` block remaps `--mat-sys-*` tokens to the `--c-*`
  vars so the Material table/paginator/dialog and the **add-student / add-professor dialog
  form-fields** (the profile page no longer uses Material form-fields — it's plain themed inputs)
  plus **filled buttons** (`mat-flat-button color="primary"` → `--mat-sys-primary` bg +
  `--mat-sys-on-primary` text) track the theme. If you change a theme's colors, this mapping already
  flows through — no per-component work.
- **`core/theme.service.ts`** holds `theme = signal<Theme>()`, initialized from `localStorage`
  (`acme-theme`); an `effect()` writes `data-theme` onto `<html>` and persists on change.
  `THEMES` (id/label/bg/accent) drives the **`shared/theme-picker`** swatches in the sidebar.
  `App` injects the service so the theme applies app-wide (incl. login/signup); `index.html` has a
  tiny inline script that sets `data-theme` before first paint to avoid a flash — **leave it.**
- **Favicon:** `public/favicon.svg` is a hand-written SVG (rounded square, bold white "A") mirroring
  the sidebar brand mark, referenced from `index.html` as `<link rel="icon" type="image/svg+xml">`.
  It uses a **fixed** hex (`#4f46e5`, the default theme primary) — favicons render outside the page
  and can't react to `data-theme`, so it intentionally doesn't track the active theme. The old
  `favicon.ico` was deleted; `public/` holds only the SVG.
- **Styling rules:** never hardcode hex in templates/component CSS — use the semantic Tailwind
  classes or `var(--c-*)`. Keep the `--c-*` names and the `@theme inline` structure stable; add a
  new token in all five `[data-theme]` blocks + the `@theme inline` map together. The look targets
  a clean, minimal SaaS dashboard (Linear/Vercel): page title `text-2xl font-bold` + `text-sm
  text-muted` subtitle, cards `border border-border … shadow-card`, no gradients/heavy color.

### Backend (`backend`)

`index.js` boots Express, connects Mongoose to `MONGODB_URI`, connects the Redis client
(`src/config/redis.js`) via `await redisClient.connect()` inside an async `start()` that
gates `app.listen`, serves the `uploads/` folder as static files
(`app.use('/uploads', express.static(...))`), and mounts four routers:

- `POST /api/auth/signup`, `POST /api/auth/login` (`src/routes/auth.js`) — bcrypt password
  hashing, JWT (`{ userId, role }`, 7-day expiry) signed with `JWT_SECRET`. Signup accepts/
  validates a `role` (`student`|`professor`, default `student`; 400 on anything else); login
  returns `role` **top-level in the JSON** alongside `token` (so the frontend has it synchronously).
- **Roles.** `src/middleware/role.js` exports a factory `requireRole(...allowedRoles)` →
  middleware that 403s unless `req.user.role` (read from the JWT by `auth.js`) is in the list.
  Compose it **after** `auth`: `router.post('/', auth, requireRole('professor'), handler)`, or for a
  whole router `router.use(auth); router.use(requireRole('professor'))`. `User.js` has a `role` enum
  field. No change to `auth.js` middleware — it already passes the full decoded token through.
- `/api/students` CRUD (`src/routes/student.js`) — all guarded by `src/middleware/auth.js`,
  which verifies the Bearer token and sets `req.user` (`= { userId, role }`). `GET /` and
  `GET /stats` are open to any authenticated role; **`POST`/`PUT`/`DELETE` add
  `requireRole('professor')`** (students get read-only access). The `GET` handler does
  server-side pagination (`page`/`limit`, capped at 100), plus a `POST /bulk-delete { ids }`
  (`deleteMany`, professor-only) for multi-select deletes and a `POST /bulk-update { ids, update }`
  (`updateMany($set)`, professor-only) that sets the same whitelisted fields (`['grade','gender']`,
  gender lowercased) on every selected row. The `GET` does
  case-insensitive `$regex` search
  across name/email/phone/rollno, exact-match filters for grade/gender (gender lowercased
  to match the schema enum), partial `$regex` filters for rollno/phone/email, and sorting
  restricted to an `ALLOWED_SORT_FIELDS` allowlist. The frontend store's query shape mirrors
  this contract exactly — keep them in sync when changing either side. `GET /stats` returns
  whole-collection dashboard counts — `{ total, male, female, other, byGrade: [{ grade, count }] }`
  (gender via a `$group` aggregation, `byGrade` via a second `$group` that skips blank grades).
  Its `$sort: { _id: 1 }` on grade is **lexicographic** (`"10"` sorts before `"2"`), so the home
  dashboard re-sorts `byGrade` numerically on the client — don't assume the array arrives in
  natural order. The `GET /` and `GET /stats` responses are **Redis-cached** (see Caching below);
  the `POST`/`PUT`/`DELETE` handlers each call `invalidatePattern('students:*')` to bust the cache
  after a mutation.
- `/api/profile` (`src/routes/profile.js`, `auth`-guarded) — the current user's own profile:
  `GET` returns `User.findById(req.user.userId).select('-password')`; `PUT` updates only a
  whitelist (`name/email/phone/bio/dob/address`, with empty `dob` coerced to `null`) and maps
  a duplicate-email index error to `400`; `POST /image` runs the multer upload middleware and
  stores the resulting path on `profileImage`.
- `/api/professors` CRUD (`src/routes/professor.js`) — `router.use(auth)` guards the whole router,
  so **any authenticated user can read** (`GET /`); `POST`/`PUT`/`DELETE` each add
  `requireRole('professor')`, so only professors mutate (same read-for-all / write-for-professor
  shape as `/api/students`). `GET /` returns the **full list** (no query params — the AG Grid
  sorts/filters/pages client-side), Redis-cached under the single key `professors:all`; the
  mutations (incl. `POST /bulk-delete { ids }` and `POST /bulk-update { ids, update }` — the latter an
  `updateMany($set)` over the whitelist `['department','designation']`, with `runValidators` enforcing
  the designation enum) bust `professors:*`. Register it in
  `index.js` (`app.use('/api/professors', …)`) — easy to forget.
- **Seed scripts (one-off, idempotent — each wipes its collection then re-inserts, and clears the
  matching cache):** `node seed-professors.js` (8 named + ~32 generated = 40 professors) and
  `node seed-students.js` (~60 students). Run them for enough rows to exercise pagination /
  multi-select / bulk delete. Students & professors are **global** collections (not per-user).

**Image uploads** use `src/middleware/upload.js` — multer `diskStorage` writing to
`backend/uploads/profile-images/<userId><ext>` (one file per user, overwritten on re-upload),
an image-only `fileFilter`, and a 2 MB size limit. The DB stores only the URL *path*
(`/uploads/profile-images/...`), never the bytes; the file is reachable via the static mount
above. `backend/uploads/` and `.env` are gitignored (`backend/.gitignore`).

**Caching (Redis)** — `src/config/redis.js` exports a single shared `redis` client (`createClient`,
`REDIS_URL` or `redis://localhost:6379`), connected once at startup. `src/utils/cache.js` wraps it
in three helpers used by the routes (not the client directly):

- `getOrSet(key, fetchFn, ttl = 60)` — return the cached JSON for `key`, else run `fetchFn()`,
  `setEx` the result with a TTL (seconds), and return it. On **any** Redis error it logs and falls
  back to `fetchFn()`, so a Redis outage degrades to direct-DB reads rather than failing the request.
- `invalidate(key)` — `del` a single key.
- `invalidatePattern(pattern)` — `keys(pattern)` then `del` the matches (used as `students:*`).

`student.js` and `professor.js` are the consumers: `student.js` `GET /` caches under
`students:<page>:<limit>:<search>:<sortBy>:<sortOrder>:<grade>:<gender>:<rollno>:<phone>:<email>`
(default 60s TTL — the key encodes the **full** query so each filter combo caches separately) and
`GET /stats` under `students:stats` (120s TTL); `professor.js` `GET /` caches the whole list under
`professors:all` (60s). Every write path busts its prefix (`students:*` / `professors:*`). When
adding a cached endpoint, fold **all** query params that change the result into the key, and
invalidate it from every mutation that can stale it. (Lesson learned: `rollno`/`phone`/`email` were
once **missing** from the key, so those filters collided with the unfiltered key and silently
returned the cached full list — a filter that looks dead but isn't is usually a missing key part.)

Models: `src/models/User.js` (`name`, `email` [unique], `password`, `role` [`student`|`professor`
enum, default `student`], plus profile fields `profileImage`, `phone`, `bio`, `dob`, `address`),
`src/models/Student.js`, and `src/models/Professor.js` (`name`, `employeeId` [unique], `email`,
`department`, `designation` [enum], `phone`, `gender` [enum, matches Student], `specialization`,
`experience`, `joiningDate`). All use `timestamps`. Profile-image URLs are cache-busted on the
frontend with `?t=<updatedAt>` since the filename is stable per user.

## Conventions

- Prettier: 100-col, single quotes; HTML uses the `angular` parser (`.prettierrc`).
- Component class names are PascalCase with no suffix (e.g. `Students`, `MainLayout`,
  `StudentStore`), matching Angular 21 CLI defaults; the component selector prefix is `app`.
- Styling is Tailwind v4 utilities with the **semantic theme classes only** (`bg-surface`,
  `text-text`, `text-muted`, `border-border`, `bg-primary`, `text-on-primary`, …) — no hardcoded
  hex in templates or component CSS (component CSS may use `var(--c-*)`). See "Theming & UI".
- Tests are Vitest `.spec.ts` files colocated with their component/service.
- **Form validation** uses reactive-forms validators. The Material dialogs (add-student /
  add-professor) render errors as inline `mat-error`s; the **profile page** uses **plain themed
  inputs** (label-above, *not* Material form-fields — see the design note below) with inline
  `text-red-500` error spans. The profile form (`features/profile/profile.ts`) deliberately uses a
  **custom email pattern** (not `Validators.email`, which accepts `a@b`), a phone pattern (optional
  `+`, 10–15 digits), and a custom `dobValidator` (real date, not future, after 1900). DOB is a
  **native `<input type="date">`** whose control value is a `'yyyy-mm-dd'` string (so the `effect`
  that patches the form from `user` formats `user.dob` to that, and Cancel/`resetForm()` re-patches
  it) — `[min]`/`[max]` take string bounds. Reuse this shape (pattern/custom validator + an inline
  error) rather than the looser built-ins when a field needs real validation.
