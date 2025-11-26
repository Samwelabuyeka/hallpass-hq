import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  Home, 
  Settings, 
  Upload, 
  User,
  Bell,
  FileText,
  Files,
  Crown,
  MessageSquare,
  Users as UsersIcon
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Connections", url: "/connections", icon: UsersIcon },
  { title: "Setup", url: "/setup", icon: Settings },
  { title: "My Timetable", url: "/timetable", icon: Calendar },
  { title: "My Units", url: "/units", icon: BookOpen },
  { title: "Exam Schedule", url: "/exams", icon: ClipboardList },
]

const otherItems = [
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Files", url: "/files", icon: Files },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Class Rep", url: "/class-rep", icon: Crown },
  { title: "Upload Data", url: "/admin", icon: Upload },
  { title: "Import Timetable", url: "/timetable-import", icon: Upload },
  { title: "Profile", url: "/profile", icon: User },
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavClassName = ({ isActive: active }: { isActive: boolean }) =>
    cn(
      "transition-smooth",
      active 
        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft" 
        : "hover:bg-sidebar-accent/50"
    )

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="MyStudent Logo" className="w-8 h-8" />
          <div>
            <h2 className="font-semibold text-sidebar-foreground">MyStudent</h2>
            <p className="text-xs text-sidebar-foreground/70">Student Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={getNavClassName}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
