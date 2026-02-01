import { Link, useLocation, useSearch } from "@tanstack/react-router"
import { TbHome, TbSettings, TbColumns } from "react-icons/tb"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { rootRoute } from "@/routes/route"

const NAV_ITEMS = [
  { label: "Home", icon: TbHome, to: "/home" as const, search: { left: undefined, right: undefined } },
  { label: "Settings", icon: TbSettings, to: "/settings/billing" as const, search: { left: undefined, right: undefined } },
  { label: "Panels", icon: TbColumns, to: "/" as const, search: { left: "/dash" as const, right: undefined } },
] as const

export function AppSidebar() {
  const location = useLocation()
  const search = useSearch({ from: rootRoute.id })
  const isPanelMode = search.left !== undefined || search.right !== undefined

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 font-semibold text-sm">
        <span>SplitState</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === "/"
                  ? isPanelMode
                  : location.pathname.startsWith(item.to)

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={isActive}
                    render={
                      <Link to={item.to} search={item.search} />
                    }
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
