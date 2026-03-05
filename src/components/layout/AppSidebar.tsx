import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import somavilivyoLogo from "@/assets/somavilivyo-logo.png";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  BookCopy,
  PlusCircle,
  Lightbulb,
  BookOpenCheck,
  UserCircle,
  Settings,
  LogOut,
  LifeBuoy,
  Info,
} from "lucide-react";

const learningNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "My Courses", icon: BookCopy },
];

const creationNavItems = [
  { href: "/create-course", label: "Create Course", icon: PlusCircle },
  { href: "/question-library", label: "Question Library", icon: BookOpenCheck },
];

const aiToolsNavItems = [
  { href: "/ai-chat", label: "AI Chatbot", icon: Lightbulb },
];

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderNavItems = (items: NavItem[], groupKey: string) => {
    return items.map((item, index) => (
      <SidebarMenuItem 
        key={item.label}
        style={{ '--stagger-index': index } as React.CSSProperties}
      >
        <SidebarMenuButton
          asChild
          isActive={
            item.href === "/dashboard"
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href)
          }
          className="w-full justify-start text-base py-3"
          title={item.label}
          tooltip={item.label}
        >
          <Link to={item.href}>
            <item.icon className="mr-3 h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Link to="/dashboard" className="flex items-center space-x-2.5 group group-data-[collapsible=icon]:space-x-0">
            <img 
              src={somavilivyoLogo} 
              alt="SomaVilivyo Logo" 
              className="h-8 w-8 group-hover:animate-pulse shrink-0 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" 
            />
            <h1 className="text-xl font-bold text-sidebar-primary group-hover:text-sidebar-accent-foreground transition-colors group-data-[collapsible=icon]:hidden">
              SomaVilivyo
            </h1>
          </Link>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 group-data-[collapsible=icon]:hidden">
                  <Avatar className="h-9 w-9 border-2 border-sidebar-accent/50">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url} 
                      alt={user.user_metadata?.full_name || user.email || 'User avatar'} 
                    />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                      {getInitials(user.user_metadata?.full_name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-background border-border shadow-xl rounded-lg" 
                align="end" 
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate text-foreground" title={user.user_metadata?.full_name || user.email || ''}>
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    {user.email && user.user_metadata?.full_name && (
                       <p className="text-xs leading-none text-muted-foreground truncate" title={user.email}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer focus:bg-accent/80">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer focus:bg-accent/80">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50"/>
                <DropdownMenuItem onClick={signOut} className="text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 px-2 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems(learningNavItems, 'learning')}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Creation</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems(creationNavItems, 'creation')}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems(aiToolsNavItems, 'ai-tools')}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3">
        <SidebarMenu>
            <SidebarMenuItem style={{ '--stagger-index': 0 } as React.CSSProperties}>
                 <SidebarMenuButton asChild tooltip="Help & Support" className="text-sm">
                    <Link to="/help">
                        <LifeBuoy className="mr-3 h-4 w-4" />
                        <span>Help & Support</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem style={{ '--stagger-index': 1 } as React.CSSProperties}>
                <SidebarMenuButton asChild tooltip="About" className="text-sm">
                    <Link to="/about">
                        <Info className="mr-3 h-4 w-4" />
                        <span>About</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-xs text-sidebar-foreground/60 text-center mt-4 group-data-[collapsible=icon]:hidden">&copy; {new Date().getFullYear()} SomaVilivyo</p>
      </SidebarFooter>
    </Sidebar>
  );
}
