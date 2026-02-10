import type { Post } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { LinkRightPanel } from '@/components/ui/link'
import { beforeLoadLog } from '@/lib/logger'
import { rightRoot } from '@/routes/right-panel'
import { wait } from '@/utils/wait'

export const postsRoute = createRoute({
  getParentRoute: () => rightRoot,
  path: '/',
  beforeLoad: ({ cause }) => beforeLoadLog(cause, 'right:/'),
  loader: async (): Promise<Post[]> => {
    await wait(1000)
    const res = await fetch('https://dummyjson.com/posts?limit=30')
    const data: { posts: Post[] } = await res.json()
    return data.posts
  },
  component: PostsListView,
})

function PostsListView() {
  const posts = postsRoute.useLoaderData() as Post[]
  return (
    <div className='space-y-1'>
      <h3 className='mb-2 text-sm font-semibold'>Posts</h3>
      <ul className='space-y-1'>
        {posts.map((post) => (
          <li key={post.id}>
            <LinkRightPanel
              to={`/${post.id}`}
              className='block w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            >
              <span className='mr-1.5 text-muted-foreground'>{post.id}.</span>
              {post.title}
            </LinkRightPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}
