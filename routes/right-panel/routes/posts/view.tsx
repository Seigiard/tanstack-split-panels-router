import { LinkRightPanel } from '@/components/ui/link'

import { postsRoute } from './route'

type Post = { id: number; title: string; body: string; userId: number }

export function PostsListView() {
  const posts = postsRoute.useLoaderData() as Post[]
  return (
    <div className='space-y-1'>
      <h3 className='mb-2 text-sm font-semibold'>Posts</h3>
      <ul className='space-y-1'>
        {posts.map((post) => (
          <li key={post.id}>
            <LinkRightPanel
              to={`/posts/${post.id}`}
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
