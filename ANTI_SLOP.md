# Anti-slop checks

Run `bun run lint:anti-slop` to check owned JavaScript and TypeScript, including tests. A dedicated GitHub Actions job runs the same command on pull requests and pushes. Existing lint commands and workflows are retained.

All 18 upstream generic rules and native `oxc/no-accumulating-spread` are enabled at error severity. No direct Effect dependency is declared, so Effect rules are not registered.

Source: [dmmulroy/anti-slop at c44ef22](https://github.com/dmmulroy/anti-slop/tree/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b/src). Exact provenance and licenses are in `tools/oxlint/anti-slop/`. Oxlint and `@oxlint/plugins` are pinned at 1.87.0. This upgrades older Oxlint installations because their matching plugin package versions are not published.

## Initial verification

The new check reports **154 existing source findings**. These are left enabled and need a separate cleanup before the pull request is ready to merge.

- `require-readable-spacing`: 91
- `require-safety-comment-for-type-assertion`: 36
- `no-unsafe-dictionary-type`: 12
- `no-known-value-widening`: 7
- `no-conditional-empty-object-spread`: 2
- `no-chained-type-assertions`: 1
- `no-runtime-typeof`: 5

| Command | Exit code |
| --- | --- |
| `bun run lint:anti-slop` | 1 |
| `bun run lint` | 1 |
| `bun --bun tsc --noEmit` | 0 |
| `bun run test` | 0 |

Typechecking and the Vitest suite pass. Existing lint reports unused identifiers in `routes/docs/$docId/index.tsx` and `routes/components/LogPanel.tsx`.

## Scope

Owned source is unchanged. Vendored plugin source, installed dependencies, generated output, and agent tooling are excluded from the new check. Existing rules are not suppressed. The separate config avoids inheriting broad legacy ignores that would exclude owned JavaScript or tests.
