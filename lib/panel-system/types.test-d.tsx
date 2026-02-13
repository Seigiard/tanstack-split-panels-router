import { panels } from '@/lib/panels'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

// ─── Left panel Link: valid static paths ──────────────────────────
;<leftPanel.Link to='/' />
;<leftPanel.Link to='/categories' />

// ─── Left panel Link: dynamic paths require params ────────────────
;<leftPanel.Link to='/categories/$category' params={{ category: 'phones' }} />
;<leftPanel.Link
  to='/categories/$category/$productId'
  params={{ category: 'phones', productId: '42' }}
/>

// ─── Left panel Link: optional search ─────────────────────────────
;<leftPanel.Link
  to='/categories/$category'
  params={{ category: 'phones' }}
  search={{ skip: '10' }}
/>

// ─── Left panel Link: className and children ──────────────────────
;<leftPanel.Link to='/categories' className='my-class'>
  Children
</leftPanel.Link>

// ─── Right panel Link: valid paths ────────────────────────────────
;<rightPanel.Link to='/' />
;<rightPanel.Link to='/$postId' params={{ postId: '5' }} />

// ─── Right panel Link: with className ─────────────────────────────
;<rightPanel.Link to='/' className='my-class'>
  Back to posts
</rightPanel.Link>

// @ts-expect-error — unknown left panel path
;<leftPanel.Link to='/nonexistent' />

// @ts-expect-error — missing required params
;<leftPanel.Link to='/categories/$category' />

// @ts-expect-error — wrong param name
;<leftPanel.Link to='/categories/$category' params={{ wrongParam: 'test' }} />

// @ts-expect-error — unknown right panel path
;<rightPanel.Link to='/nonexistent' />

// @ts-expect-error — missing required params for right panel
;<rightPanel.Link to='/$postId' />

// ─── MainLink: valid main router paths ──────────────────────────
;<panels.MainLink to='/' />
;<panels.MainLink to='/users' />
;<panels.MainLink to='/docs/$docId' params={{ docId: 'features' }} />

// ─── MainLink: dynamic paths require params ─────────────────────
;<panels.MainLink to='/users/$userId' params={{ userId: '1' }} />

// ─── MainLink: standard Link props ──────────────────────────────
;<panels.MainLink to='/' className='foo' />
;<panels.MainLink to='/' preload='intent' />
;<panels.MainLink to='/'>Children</panels.MainLink>

// ─── MainLink: search is NOT required (always cleared) ──────────
;<panels.MainLink to='/users' />

// @ts-expect-error — unknown main route path
;<panels.MainLink to='/nonexistent' />

// @ts-expect-error — wrong param name for /users/$userId
;<panels.MainLink to='/users/$userId' params={{ wrongParam: '1' }} />
