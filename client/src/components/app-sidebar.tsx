import {
  LayoutDashboard,
  Calendar,
  Image,
  Package,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  Settings,
  BookOpen,
  BarChart3,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
    testId: "nav-events",
  },
  {
    title: "DDC Gallery",
    url: "/gallery",
    icon: Image,
    testId: "nav-gallery",
  },
  {
    title: "Assets",
    url: "/assets",
    icon: Package,
    testId: "nav-assets",
  },
  {
    title: "Vendors",
    url: "/vendors",
    icon: Briefcase,
    testId: "nav-vendors",
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    testId: "nav-team",
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: DollarSign,
    testId: "nav-expenses",
  },
  {
    title: "Catalog",
    url: "/catalog",
    icon: BookOpen,
    testId: "nav-catalog",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    testId: "nav-reports",
  },
  {
    title: "Configuration",
    url: "/configuration",
    icon: Settings,
    testId: "nav-configuration",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold px-4 py-6">
            Dream Day Crew
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-2">
          {user && (
            <div className="text-sm">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.designation}</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="justify-start text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
