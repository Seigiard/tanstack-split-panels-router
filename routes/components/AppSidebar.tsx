import { useLocation } from '@tanstack/react-router'
import { TbHome, TbListCheck, TbUsers, TbColumns } from 'react-icons/tb'

import { Link } from '@/components/ui/link'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { panels } from '@/lib/panels'

export function AppSidebar() {
  const location = useLocation()
  const { isPanelMode } = panels.usePanel()

  return (
    <Sidebar className='h-screen w-48 border-r border-border'>
      <SidebarHeader className='p-3 text-sm font-semibold'>
        <span>SplitState</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={!isPanelMode && location.pathname === '/'}
                render={<Link to='/' />}
              >
                <TbHome />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  !isPanelMode && location.pathname.startsWith('/features')
                }
                render={<Link to='/features' />}
              >
                <TbListCheck />
                <span>Features</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  !isPanelMode && location.pathname.startsWith('/users')
                }
                render={<Link to='/users' />}
              >
                <TbUsers />
                <span>Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isPanelMode}
                render={<panels.Link left='/categories' />}
              >
                <TbColumns />
                <span>Products</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
