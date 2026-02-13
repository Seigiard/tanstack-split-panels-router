import type { PropsWithChildren } from 'react'
import {
  TbX,
  TbLayoutSidebarLeftExpand,
  TbLayoutSidebarRightExpand,
} from 'react-icons/tb'

import { panels } from '@/lib/panels'
import { leftPanel } from '@/routes/left-panel'
import { rightPanel } from '@/routes/right-panel'

export function PanelLayout() {
  const { left, right } = panels.usePanel()

  return (
    <div className='flex min-h-0 flex-1 overflow-hidden'>
      {left.isOpen ? (
        <Panel title='Left Panel' onClose={left.close}>
          <leftPanel.Outlet />
        </Panel>
      ) : (
        <CollapsedPanel
          icon={<TbLayoutSidebarLeftExpand />}
          onClick={() => left.navigate('/categories')}
        />
      )}

      {right.isOpen ? (
        <Panel title='Right Panel' onClose={right.close}>
          <rightPanel.Outlet />
        </Panel>
      ) : (
        <CollapsedPanel
          icon={<TbLayoutSidebarRightExpand />}
          onClick={() => right.navigate('/')}
        />
      )}
    </div>
  )
}

function Panel({
  children,
  title,
  onClose,
}: PropsWithChildren<{ title: string; onClose: () => void }>) {
  return (
    <div className='grid min-w-0 flex-1 grid-rows-[min-content_1fr] gap-2 bg-accent p-2'>
      <div className='flex items-center justify-between'>
        <h2 className='text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
          {title}
        </h2>
        <button
          onClick={onClose}
          className='rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <TbX className='h-3.5 w-3.5' />
        </button>
      </div>
      <div className='h-full overflow-y-auto rounded-xl bg-white p-4 shadow-sm'>
        {children}
      </div>
    </div>
  )
}

function CollapsedPanel({
  icon,
  onClick,
}: {
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <div className='flex items-start bg-accent p-2'>
      <button
        onClick={onClick}
        className='rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        {icon}
      </button>
    </div>
  )
}
