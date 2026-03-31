import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  KanbanSquare,
  FileText,
  GitBranch,
  CreditCard,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { currentUser, currentRole } from "@/data/mock";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import acesLogo from "@/assets/aces_logo.png";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Billboard", href: "/billboard", icon: Megaphone },
  { label: "Tasks", href: "/tasks", icon: KanbanSquare },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Chain of Command", href: "/chain", icon: GitBranch },
  { label: "Digital ID", href: "/id", icon: CreditCard },
];

const adminItems = [
  { label: "Role Manager", href: "/admin/roles", icon: Shield },
  { label: "Members", href: "/admin/members", icon: Users },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const initials = currentUser.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <img src={acesLogo} alt="ACES" className="w-9 h-9 shrink-0 object-contain" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold font-heading text-gold tracking-wide truncate">
              A.C.E.S.
            </h1>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">
              BCP — Computer Engineering
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);

          const link = (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-gold glow-gold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-gold" : "text-sidebar-foreground/50 group-hover:text-cyan"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}

        {/* Admin Section */}
        {currentRole.permissions.length > 0 && (
          <>
            <div className="pt-3 pb-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                  Admin
                </p>
              )}
              {collapsed && <Separator className="bg-sidebar-border" />}
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);

              const link = (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-accent text-gold glow-gold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-gold" : "text-sidebar-foreground/50 group-hover:text-cyan"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </>
        )}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User Profile */}
      <div className="px-2 py-3">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
            <AvatarFallback className="bg-navy-light text-gold text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentUser.fullName}
              </p>
              <Badge
                variant="outline"
                className="mt-0.5 text-[10px] px-1.5 py-0 h-4 border-0 font-semibold"
                style={{
                  backgroundColor: `${currentRole.color}20`,
                  color: currentRole.color,
                }}
              >
                {currentRole.name}
              </Badge>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-navy-light border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-gold hover:border-gold transition-all duration-200 shadow-md"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
