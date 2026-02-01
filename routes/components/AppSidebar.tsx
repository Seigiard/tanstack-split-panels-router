import { useLocation, useSearch } from '@tanstack/react-router'
import { TbHome, TbSettings, TbColumns } from 'react-icons/tb'

import { Link, LinkPanels } from '@/components/ui/link'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { rootRoute } from '@/routes/route'

export function AppSidebar() {
  const location = useLocation()
  const search = useSearch({ from: rootRoute.id })
  const isPanelMode = search.left !== undefined || search.right !== undefined

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='p-3 text-sm font-semibold'>
        <span>SplitState</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={!isPanelMode && location.pathname.startsWith('/home')}
                render={<Link to='/home' />}
              >
                <TbHome />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  !isPanelMode && location.pathname.startsWith('/settings')
                }
                render={<Link to='/settings/billing' />}
              >
                <TbSettings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isPanelMode}
                render={<LinkPanels left='/dash' />}
              >
                <TbColumns />
                <span>Panels</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
