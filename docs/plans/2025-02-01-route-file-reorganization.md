# Route File Reorganization

> Restructure routes/ into a self-contained, file-per-route directory tree.

## Conventions

| File          | Role                             |
| ------------- | -------------------------------- |
| `route.tsx`   | Route definition + tree assembly |
| `view.tsx`    | React component for the route    |
| `index.tsx`   | Index route of parent (path `/`) |
| `components/` | Local components for the route   |
| `routes/`     | Child routes                     |

## Target Structure

```
routes/
├── route.tsx                    # rootRoute, routeTree, mainRouter, Register
├── index.tsx                    # path '/' landing page
├── components/                  # shared across all routes
│   ├── AppSidebar.tsx
│   ├── PanelShell.tsx
│   ├── LogPanel.tsx
│   └── panel-links.tsx
│
├── home/
│   ├── route.tsx
│   └── view.tsx
│
├── settings/
│   ├── route.tsx
│   ├── view.tsx
│   └── routes/
│       └── billing/
│           ├── route.tsx
│           └── view.tsx
│
├── left-panel/
│   ├── route.tsx
│   └── routes/
│       └── dash/
│           ├── route.tsx
│           ├── view.tsx
│           ├── index.tsx
│           └── routes/
│               ├── sub1/
│               │   ├── route.tsx
│               │   └── view.tsx
│               └── sub2/
│                   ├── route.tsx
│                   └── view.tsx
│
└── right-panel/
    ├── route.tsx
    └── routes/
        └── posts/
            ├── route.tsx
            ├── view.tsx
            └── routes/
                └── $postId/
                    ├── route.tsx
                    └── view.tsx
```

Files that don't move: `App.tsx`, `index.tsx` (entry), `index.css`, `lib/`, `hooks/`, `components/ui/`, `utils/`

## Wiring

Each `route.tsx` exports its route object. Parent imports children and assembles via `.addChildren()`. View components imported from `./view.tsx` instead of inline functions.

## Migration Steps

1. Create directory structure
2. Move shared components → `routes/components/`, update imports
3. Migrate right panel (most isolated)
4. Migrate left panel
5. Migrate main routes (home, settings, billing, index)
6. Update `App.tsx` import
7. Verify: `bun run dev` + `bunx tsc --noEmit`

Each step is a separate commit.
