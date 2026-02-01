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
```

## File Structure Conventions

| File | Role |
|------|------|
| `route.tsx` | Route definition + tree assembly (createRoute, beforeLoad, loader) |
| `view.tsx` | React component for the route |
| `index.tsx` | Index route of parent (path `/`) |
| `components/` | Local components scoped to this route |
| `routes/` | Child routes |

By default, `route.tsx` imports `view.tsx` and sets `component` directly in `createRoute()`.

When `view.tsx` imports its own `route.tsx` (for `useLoaderData`/`useRouteContext({ from: route.id })`), this would create a circular dependency. In that case, the parent assembly file wires component via `.update({ component })`. Currently applies to: `homeRoute`, `postsRoute`, `postDetailRoute`.

Trivial index routes define `component` inline.

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

**Main route:** create `routes/<name>/route.tsx` + `view.tsx`, wire in `routes/route.tsx`

**Panel route:** create under `routes/<panel>/routes/<name>/`, wire in `routes/<panel>/route.tsx`

See "Patterns" section in `docs/context/splitstate-router.md` for full steps.
