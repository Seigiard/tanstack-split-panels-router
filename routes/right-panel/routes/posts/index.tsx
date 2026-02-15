import type { Post } from '@/lib/api-types'
import { createRoute } from '@tanstack/react-router'

import { beforeLoadLog } from '@/lib/logger'
import { usePanelLoaderData } from '@/lib/panel-system'
import { rightPanel, rightRoot } from '@/routes/right-panel'
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
  const posts = usePanelLoaderData({ from: postsRoute })
  return (
    <div>
      <h3>Posts</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <rightPanel.Link to='/$postId' params={{ postId: String(post.id) }}>
              {post.id}. {post.title}
            </rightPanel.Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
