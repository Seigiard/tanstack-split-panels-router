import type { Comment, Post } from '@/lib/api-types'

import { LinkRightPanel } from '@/components/ui/link'

import { postDetailRoute } from './route'

export function PostDetailView() {
  const { post, comments } = postDetailRoute.useLoaderData() as {
    post: Post
    comments: Comment[]
  }
  return (
    <div className='space-y-4'>
      <LinkRightPanel
        to='/posts'
        className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
      >
        &larr; Back to posts
      </LinkRightPanel>
      <div>
        <h3 className='text-sm font-semibold'>{post.title}</h3>
        <p className='mt-1 text-sm text-muted-foreground'>{post.body}</p>
      </div>
      <div>
        <h4 className='mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase'>
          Comments ({comments.length})
        </h4>
        <ul className='space-y-3'>
          {comments.map((c) => (
            <li key={c.id} className='rounded border border-border p-2 text-sm'>
              <span className='font-medium'>{c.user.fullName}</span>
              <p className='mt-0.5 text-muted-foreground'>{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
