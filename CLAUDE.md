# SplitState Router

Dual-panel navigation system on TanStack Router v1. Two independent viewports with memory history, main router owns browser URL, panel state encoded in query params.

## Architecture context

Read `docs/context/splitstate-router.md` for full architecture, gotchas, and patterns.

## Tech Stack

- React 19, TanStack Router v1.157+, TypeScript 5.8 (strict)
- Vite 6, Tailwind CSS 4, shadcn/ui
- Package manager: **bun**
- Linting: **oxlint**, Formatting: **oxfmt**

## Commands

```bash
bun run dev          # Dev server on port 3000
bun run build        # Production build
bunx tsc --noEmit    # Type check
bun run fix          # Format (oxfmt) + lint fix (oxlint)
```

## Workflow

- Always run `bun run fix` after completing a task (before committing).
- All user-facing content on the site must be in English.

## File Structure Conventions

| File          | Role                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `index.tsx`   | Route definition + component (default file for a route directory)        |
| `route.tsx`   | Parent layout route (used when directory also has `index.tsx` for child) |
| `components/` | Local components scoped to this route                                    |
| `<dir>/`      | Child routes as sibling directories (no `routes/` intermediary)          |

Each route file defines both the route and its component in a single file. The component function is declared below `createRoute()` — function hoisting makes it available as a reference, and the route const is initialized by the time the component renders.

Layout routes that only render `<Outlet />` define `component` inline.

File structure must mirror the route tree: sibling routes live at the same directory level, nested routes in subdirectories.

## Import Conventions

- Files nested 3+ levels deep use `@/*` alias (maps to project root)
- Shallow files use relative imports
- Group: external → internal (`@/`) → relative

## Key Directories

```
routes/              # all route definitions + shared route components
routes/components/   # shared: AppSidebar, PanelShell, LogPanel
lib/                 # panel-context, logger, utils
components/ui/       # shadcn/ui primitives (don't modify)
```

## Adding Routes

**Leaf route:** create `routes/<name>/index.tsx` (route + component), add to tree in assembly file

**Layout route (with children):** create `routes/<name>/route.tsx` (layout with Outlet) + `routes/<name>/index.tsx` (index child), add to tree in assembly file

**Sibling routes:** place at the same directory level (e.g. `routes/posts/` and `routes/$postId/`)

See "Patterns" section in `docs/context/splitstate-router.md` for full steps.

## Feature Tracking

After implementing a TanStack Router feature, update the status table in `routes/home/index.tsx` — change `<Todo />` to the matching Done badge (`<DoneMain>`, `<DoneLeft>`, `<DoneRight>`).
