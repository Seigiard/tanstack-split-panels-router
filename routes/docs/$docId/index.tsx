import { createRoute, redirect } from '@tanstack/react-router'

import { docsRoute } from '../route'

const docs = import.meta.glob('/docs/*.md', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const VALID_DOCS = [
  'quickstart',
  'features',
  'architecture',
  'guides',
  'api-reference',
]

function resolveDoc(docId: string): string | undefined {
  return docs[`/docs/${docId}.md`]
}

export const docPageRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: '$docId',
  staticData: {
    breadcrumb: ({ params }: { params: Record<string, string> }) =>
      params.docId,
  },
  beforeLoad: ({ params }) => {
    if (!VALID_DOCS.includes(params.docId)) {
      throw redirect({ to: '/docs/$docId', params: { docId: 'features' } })
    }
  },
  component: DocPageView,
})

function DocPageView() {
  const { docId } = docPageRoute.useParams()
  const html = resolveDoc(docId)

  if (!html) return null

  // Safe: HTML is generated from our own .md files at build time by marked
  return <article dangerouslySetInnerHTML={{ __html: html }} />
}
