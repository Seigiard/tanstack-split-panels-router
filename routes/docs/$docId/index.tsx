import { createRoute, redirect } from '@tanstack/react-router'

import { beforeLoadLog, logger } from '@/lib/logger'

import { docsRoute } from '../route'

const docs = import.meta.glob('/docs/*.md', {
  eager: true,
  import: 'default',
}) as Record<string, string>

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
  beforeLoad: ({ cause, params }) => {
    if (!resolveDoc(params.docId)) {
      throw redirect({ to: '/docs/$docId', params: { docId: '01-quickstart' } })
    }
    beforeLoadLog(cause, `/docs/${params.docId}`)
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
