# Quick Start

## 1. Define Panel Route Trees

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

## 2. Create Panel System

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

## 3. Mount Provider

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

## 4. Render Panels

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

## 5. Navigate Between Panels

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

## Key Concepts

### Panels

Independent router instances with their own route trees and memory history. Each panel is defined with `createPanel()` and includes its own route tree, default path, and navigation components.

### System

A collection of panels managed together. Created with `createPanelSystem()`, it provides a Provider, cross-panel navigation components, and hooks for coordinating panel state.

### Provider

React context provider that must wrap your entire application. It handles URL synchronization, lazy router initialization, and provides navigation state to all components.

### URL Encoding

Panel state is encoded in the main router's search parameters. Each panel gets a named query parameter (e.g., `?left=/categories/phones&right=/posts/5`) that stores the panel's current path and search params.
