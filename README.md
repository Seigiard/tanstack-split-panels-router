# Panel System Library

A generic, type-safe React library for building dual-router navigation systems on TanStack Router v1. Enables independent viewports with memory history while synchronizing state through URL search parameters.

## What It Does

The panel system library allows you to run multiple independent TanStack Router instances (panels) alongside your main router. Each panel has its own navigation state and memory history, while the main router owns the browser URL. Panel state is encoded in query parameters (`?left=/categories&right=/posts/1`), enabling bookmarkable, shareable URLs for complex multi-viewport UIs.

## Key Concepts

### Panels

Independent router instances with their own route trees and memory history. Each panel is defined with `createPanel()` and includes its own route tree, default path, and navigation components.

### System

A collection of panels managed together. Created with `createPanelSystem()`, it provides a Provider, cross-panel navigation components, and hooks for coordinating panel state.

### Provider

React context provider that must wrap your entire application. It handles URL synchronization, lazy router initialization, and provides navigation state to all components.

### URL Encoding

Panel state is encoded in the main router's search parameters. Each panel gets a named query parameter (e.g., `?left=/categories/phones&right=/posts/5`) that stores the panel's current path and search params.

## Quick Start

### 1. Define Panel Route Trees

```tsx
// routes/left-panel/index.tsx
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { createPanel } from '@/lib/panel-system'

const leftRoot = createRootRoute({
  component: () => <Outlet />,
})

const categoriesRoute = createRoute({
  getParentRoute: () => leftRoot,
  path: '/categories',
  component: CategoriesView,
})

const leftPanelTree = leftRoot.addChildren([categoriesRoute])

export const leftPanel = createPanel({
  name: 'left',
  tree: leftPanelTree,
  defaultPath: '/categories',
})
```

### 2. Create Panel System

```tsx
// lib/panels.ts
import { createPanelSystem } from '@/lib/panel-system'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

export const panels = createPanelSystem({
  panels: { left: leftPanel, right: rightPanel },
  onNavigate: (panel, action, path) => {
    console.log(`[${panel}] ${action}`, path)
  },
})
```

### 3. Mount Provider

```tsx
// routes/route.tsx
import { panels } from '@/lib/panels'

function RootLayout() {
  return (
    <panels.Provider>
      <AppShell />
    </panels.Provider>
  )
}
```

### 4. Render Panels

```tsx
// components/PanelLayout.tsx
import { panels } from '@/lib/panels'
import { leftPanel, rightPanel } from '@/lib/panels'

function PanelLayout() {
  const { left, right } = panels.usePanel()

  return (
    <div className='flex'>
      {left.isOpen && (
        <div>
          <leftPanel.Outlet />
        </div>
      )}
      {right.isOpen && (
        <div>
          <rightPanel.Outlet />
        </div>
      )}
    </div>
  )
}
```

### 5. Navigate Between Panels

```tsx
// Per-panel typed navigation
<leftPanel.Link to="/categories/$cat" params={{ cat: 'phones' }} />

// Multi-panel navigation
<panels.Link left="/categories" right={{ to: '/posts/$id', params: { id: '5' } }} />

// Programmatic navigation
const { left, right } = panels.usePanel()
left.navigate('/categories/phones')
right.close()
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser URL: /?left=/categories/phones&right=/posts/5      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│               Main Router (TanStack Router)                   │
│         - Owns browser history and URL bar                    │
│         - Manages search params (left, right)                 │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│           panels.Provider (PanelSystemContext)                │
│    - Reads search params from main router                     │
│    - Creates/retrieves panel routers (lazy)                   │
│    - Syncs URL → panel routers (useLayoutEffect)              │
│    - Provides navigation methods                              │
└─────┬────────────────────────────────────────────────┬───────┘
      │                                                 │
      ▼                                                 ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│  Left Panel Router      │               │  Right Panel Router     │
│  (Memory History)       │               │  (Memory History)       │
│  - Independent state    │               │  - Independent state    │
│  - Route tree           │               │  - Route tree           │
│  - Navigation stack     │               │  - Navigation stack     │
└────────┬────────────────┘               └────────┬────────────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│  <leftPanel.Outlet />   │               │  <rightPanel.Outlet />  │
│  - Renders RouterProvider│               │  - Renders RouterProvider│
│  - PanelIdentityContext │               │  - PanelIdentityContext │
│  - Error boundary       │               │  - Error boundary       │
└─────────────────────────┘               └─────────────────────────┘
```

## Navigation Flow

```
1. User clicks <leftPanel.Link to="/categories/phones" />
   │
   ├─> Builds href via mainRouter.buildLocation()
   │   (for modifier key support: ctrl+click opens new tab)
   │
   └─> On click (no modifiers):
       │
       ├─> Resolves params: /categories/$cat → /categories/phones
       │
       ├─> navigatePanel('left', '/categories/phones')
       │   │
       │   ├─> Updates left panel router (memory history)
       │   │
       │   └─> Updates main router search params:
       │       navigate({ to: '/', search: { left: '/categories/phones', right: '...' } })
       │
       └─> URL becomes: /?left=/categories/phones&right=...

2. URL changes (e.g., browser back button)
   │
   └─> panels.Provider useLayoutEffect detects search param change
       │
       └─> Syncs to panel router: panelNavigate(router, panelValue)
```

## Type Safety

The library provides full TypeScript inference for panel routes:

```tsx
// Type error: unknown path
<leftPanel.Link to="/nonexistent" />

// Type error: missing required params
<leftPanel.Link to="/categories/$category" />

// Correct: all params provided
<leftPanel.Link to="/categories/$category" params={{ category: 'phones' }} />
```

## When to Use

**Use this library when:**

- You need multiple independent navigation contexts in one UI
- You want bookmarkable/shareable URLs for complex multi-viewport states
- You need type-safe navigation across separate route trees
- You're building master-detail, split-pane, or multi-panel UIs

**Don't use this library when:**

- You only need a single router (use TanStack Router directly)
- You need panels to share navigation history (use nested routes instead)
- You don't need URL state persistence (use local state instead)

## Documentation

- [Features](docs/features.md) — TanStack Router patterns in multi-panel mode
- [Architecture](docs/architecture.md) — Implementation details and design decisions
- [Guides](docs/guides.md) — Step-by-step tutorials
- [API Reference](docs/api-reference.md) — Complete API documentation
