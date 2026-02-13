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
    <div className='panel-container'>
      {left.isOpen ? (
        <Panel title='Left Panel' onClose={left.close}>
          <leftPanel.Outlet />
        </Panel>
      ) : (
        <section className='panel panel-collapsed'>
          <div className='panel-header'>
            <button onClick={() => left.navigate('/categories')}>
              <TbLayoutSidebarLeftExpand />
            </button>
          </div>
        </section>
      )}

      {right.isOpen ? (
        <Panel title='Right Panel' onClose={right.close}>
          <rightPanel.Outlet />
        </Panel>
      ) : (
        <section className='panel panel-collapsed'>
          <div className='panel-header'>
            <button onClick={() => right.navigate('/')}>
              <TbLayoutSidebarRightExpand />
            </button>
          </div>
        </section>
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
    <section className='panel panel-expanded'>
      <div className='panel-header'>
        <h2>{title}</h2>
        <button onClick={onClose}>
          <TbX />
        </button>
      </div>
      <div className='panel-body'>{children}</div>
    </section>
  )
}
