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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

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
    </Sidebar>
  );
}
