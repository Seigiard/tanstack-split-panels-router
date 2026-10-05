# SplitState Router

Dual-panel navigation system on TanStack Router v1. Two independent viewports with memory history, main router owns browser URL, panel state encoded in query params.

Panel query values are decoded with Zod in `lib/panel-system/search-schema.ts`. String values identify panel paths; other values close the panel. Panel hooks use the nearest memory router and carry route types across TanStack's main-router-only global registry.

## Documentation

Read `README.md`

- [Features](docs/features.md) — TanStack Router patterns in multi-panel mode
- [Architecture](docs/architecture.md) — Implementation details and design decisions
- [Guides](docs/guides.md) — Step-by-step tutorials
- [API Reference](docs/api-reference.md) — Complete API documentation
