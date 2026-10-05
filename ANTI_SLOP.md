# Anti-slop checks

Run `bun run lint:anti-slop` to check owned JavaScript and TypeScript, including tests. A dedicated GitHub Actions job runs the same command on pull requests and pushes. Existing lint commands and workflows are retained.

All 18 upstream generic rules and native `oxc/no-accumulating-spread` are enabled at error severity. No direct Effect dependency is declared, so Effect rules are not registered.

Source: [dmmulroy/anti-slop at c44ef22](https://github.com/dmmulroy/anti-slop/tree/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b/src). Exact provenance and licenses are in `tools/oxlint/anti-slop/`. Oxlint and `@oxlint/plugins` are pinned at 1.87.0. This upgrades older Oxlint installations because their matching plugin package versions are not published.

## Initial verification

The installation initially reported **154 source findings**. The same PR now fixes them without changing rule severity or widening ignores.

- `require-readable-spacing`: 91
- `require-safety-comment-for-type-assertion`: 36
- `no-unsafe-dictionary-type`: 12
- `no-known-value-widening`: 7
- `no-conditional-empty-object-spread`: 2
- `no-chained-type-assertions`: 1
- `no-runtime-typeof`: 5

| Command                  | Exit code |
| ------------------------ | --------- |
| `bun run lint:anti-slop` | 1         |
| `bun run lint`           | 1         |
| `bun --bun tsc --noEmit` | 0         |
| `bun run test`           | 0         |

These exit codes describe the installation baseline. The cleanup also removes the unused import in `routes/docs/$docId/index.tsx` and unused callback parameter in `routes/components/LogPanel.tsx`.

## Cleanup verification

- Anti-slop and existing lint report zero errors.
- TypeScript, Vitest runtime tests, Vitest type tests, and the Vite production build pass.
- Zod decodes panel search values at the routing boundary. Non-string panel values still become undefined. Navigation retains omission of absent search options and conditional pending configuration.
- Open dictionary casts and the chained assertion are removed. Remaining registry-bridge assertions state the panel route invariant with `SAFETY:` comments.
- Whitespace is committed separately. A second fix/format pass leaves the source diff unchanged.

## Scope

Owned source and tests are included in cleanup. Vendored plugin source, installed dependencies, generated output, and agent tooling are excluded from the check. Existing rules are not suppressed. The separate config avoids inheriting broad legacy ignores that would exclude owned JavaScript or tests.
