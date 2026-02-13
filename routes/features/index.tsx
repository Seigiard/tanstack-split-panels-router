import { createRoute } from '@tanstack/react-router'

import { Link } from '@/components/ui/link'
import { panels } from '@/lib/panels'

import { leftPanel } from '../left-panel'
import { rightPanel } from '../right-panel'
import { rootRoute } from '../route'

export const featuresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/features',
  staticData: { breadcrumb: 'Features' },
  component: FeaturesView,
})

// ─── Feature data ────────────────────────────────────────

type PanelDemo =
  | { type: 'left'; to: string }
  | { type: 'right'; to: string }
  | { type: 'both'; left: string; right: string }

type Feature = {
  title: string
  description: string
  code: string
  mainDemo?: string
  panelDemo?: PanelDemo
}

const FEATURES: Feature[] = [
  {
    title: 'Loaders',
    description:
      'Each route defines a loader that fetches data before the component renders. Works identically in both the main router and panel routers.',
    code: `const categoriesRoute = createRoute({
  loader: async () => {
    const res = await fetch('/api/categories')
    return res.json()
  },
})`,
    mainDemo: '/users',
    panelDemo: { type: 'left', to: '/categories' },
  },
  {
    title: 'Pending UI',
    description:
      'While a loader runs, the pending component is shown automatically. Configured globally via defaultPendingMs and defaultPendingComponent.',
    code: `// Right panel posts loader has a 1s delay:
loader: async () => {
  await wait(1000)
  const res = await fetch('/api/posts?limit=30')
  return res.json()
}

// Pending behavior configured on the router:
createRouter({
  defaultPendingMs: 200,
  defaultPendingComponent: RoutePending,
})`,
    mainDemo: '/users',
    panelDemo: { type: 'right', to: '/' },
  },
  {
    title: 'Path Params',
    description:
      'Dynamic segments like $postId are extracted and passed to loaders and components with full type safety.',
    code: `const postDetailRoute = createRoute({
  path: '/$postId',
  loader: async ({ params }) => {
    const res = await fetch(\`/api/posts/\${params.postId}\`)
    return res.json()
  },
})`,
    mainDemo: '/users/1',
    panelDemo: { type: 'right', to: '/1' },
  },
  {
    title: 'Search Params',
    description:
      'Typed and validated search params with validateSearch. The loader re-runs when search deps change — pagination, filters, etc.',
    code: `const route = createRoute({
  validateSearch: (search): CategorySearch => ({
    skip: Number(search.skip) || 0,
    limit: Number(search.limit) || 10,
  }),
  loaderDeps: ({ search }) => ({
    skip: search.skip,
    limit: search.limit,
  }),
  loader: async ({ deps }) => {
    return fetch(\`/api/products?skip=\${deps.skip}&limit=\${deps.limit}\`)
  },
})`,
    panelDemo: { type: 'left', to: '/categories' },
  },
  {
    title: 'beforeLoad',
    description:
      'Pre-render hook for guards, redirects, and context injection. Runs before the loader, available in both main and panel routes.',
    code: `const route = createRoute({
  beforeLoad: ({ cause }) => {
    beforeLoadLog(cause, 'left:/categories')
    return {
      label: 'Categories',
      description: 'Browse product categories',
    }
  },
})`,
    mainDemo: '/',
    panelDemo: { type: 'left', to: '/' },
  },
  {
    title: 'Nested Layouts',
    description:
      'Layout routes render an Outlet for child content. The categories layout wraps the index and $category children.',
    code: `// route.tsx — layout
const categoriesRoute = createRoute({
  path: '/categories',
  component: () => <Outlet />,
})

// index.tsx — renders inside the layout
const categoriesIndexRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: '/',
  component: CategoriesView,
})`,
    panelDemo: { type: 'left', to: '/categories' },
  },
  {
    title: 'useMatches & Breadcrumbs',
    description:
      'useMatches returns the full chain of matched routes. Combined with staticData.breadcrumb, it builds automatic breadcrumb navigation that works in both main and panel contexts.',
    code: `const matches = useMatches()

const crumbs = matches
  .filter((m) => m.staticData.breadcrumb)
  .map((m) => ({
    path: m.pathname,
    label: typeof m.staticData.breadcrumb === 'function'
      ? m.staticData.breadcrumb({ params: m.params })
      : m.staticData.breadcrumb,
  }))`,
    mainDemo: '/users/1',
    panelDemo: { type: 'left', to: '/categories/beauty' },
  },
  {
    title: 'Type-Safe Links',
    description:
      'Panel links validate the to path and params at compile time, just like standard TanStack Router links.',
    code: `<leftPanel.Link
  to="/categories/$category"
  params={{ category: cat.slug }}
>
  {cat.name}
</leftPanel.Link>`,
    panelDemo: { type: 'left', to: '/categories' },
  },
  {
    title: 'URL Sync',
    description:
      'Panel paths are encoded as query params in the main URL. Bookmarking and sharing preserves the full panel state.',
    code: `// Root route validates panel search params:
const rootRoute = createRootRoute({
  validateSearch: panels.validateSearch,
})

// Resulting URL:
// /?left=%2Fcategories%2Felectronics&right=%2F1`,
    panelDemo: { type: 'both', left: '/categories', right: '/' },
  },
  {
    title: 'Cross-Panel Navigation',
    description:
      'Any component can navigate any panel via the usePanel hook. Open, close, or redirect panels from anywhere in the app.',
    code: `const { left, right } = panels.usePanel()

right.navigate('/posts')
left.close()`,
    panelDemo: { type: 'left', to: '/categories' },
  },
  {
    title: 'Programmatic Navigation',
    description:
      'Panel-scoped useNav hook for imperative navigation with search params. Used for pagination, form submissions, etc.',
    code: `const nav = leftPanel.useNav()

nav.navigate(\`/categories/\${category}\`, {
  search: { skip: '0', limit: '10' },
})`,
    panelDemo: { type: 'left', to: '/categories/beauty' },
  },
]

// ─── Components ──────────────────────────────────────────

const DEMO_LINK =
  'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm transition-colors hover:bg-muted'

function PanelDemoLink({ demo }: { demo: PanelDemo }) {
  if (demo.type === 'both') {
    return (
      <panels.Link
        left={{ to: demo.left }}
        right={{ to: demo.right }}
        className={DEMO_LINK}
      >
        Panel demo &rarr;
      </panels.Link>
    )
  }

  const PLink = demo.type === 'left' ? leftPanel.Link : rightPanel.Link
  return (
    <PLink to={demo.to as '/'} className={DEMO_LINK}>
      Panel demo &rarr;
    </PLink>
  )
}

function toSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-')
}

function FeatureSection({ feature }: { feature: Feature }) {
  const slug = toSlug(feature.title)
  return (
    <section id={slug} className='scroll-mt-8 space-y-3'>
      <a href={`#${slug}`} className='group'>
        <h2 className='text-lg font-semibold'>
          {feature.title}
          <span className='ml-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'>
            #
          </span>
        </h2>
      </a>
      <p className='text-sm text-muted-foreground'>{feature.description}</p>
      <pre className='overflow-x-auto rounded-lg border bg-muted px-4 py-3 font-mono text-sm leading-relaxed'>
        {feature.code}
      </pre>
      <div className='flex flex-wrap gap-2'>
        {feature.mainDemo && (
          <Link to={feature.mainDemo as '/'} className={DEMO_LINK}>
            TanStack demo &rarr;
          </Link>
        )}
        {feature.panelDemo && <PanelDemoLink demo={feature.panelDemo} />}
      </div>
    </section>
  )
}

function FeaturesView() {
  return (
    <div className='max-w-3xl space-y-10 p-8'>
      <div>
        <h1 className='text-2xl font-bold'>Features</h1>
        <p className='mt-2 text-muted-foreground'>
          Standard TanStack Router patterns that work out of the box in
          multi-panel mode.
        </p>
      </div>
      {FEATURES.map((f) => (
        <FeatureSection key={f.title} feature={f} />
      ))}
    </div>
  )
}
