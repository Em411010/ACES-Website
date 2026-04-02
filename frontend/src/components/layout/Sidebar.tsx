import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  KanbanSquare,
  FileText,
  CalendarCheck,
  GitBranch,
  CreditCard,
  Shield,
  Users,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import acesLogo from "@/assets/aces_logo.png";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Billboard", href: "/billboard", icon: Megaphone },
  { label: "Tasks", href: "/tasks", icon: KanbanSquare },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Activities", href: "/activities", icon: CalendarCheck },
  { label: "Chain of Command", href: "/chain", icon: GitBranch },
  { label: "Digital ID", href: "/id", icon: CreditCard },
];

const adminItems = [
  { label: "Role Manager", href: "/admin/roles", icon: Shield },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Audit Trail", href: "/admin/audit", icon: ScrollText },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.roleId && typeof user.roleId === "object" ? (user.roleId as Role) : null;
  const initials = (user?.fullName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          // Mobile: off-screen by default, slide in when mobileOpen
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          // Desktop: respect collapsed state
          collapsed ? "md:w-[68px]" : "md:w-64",
          // Mobile: always full-width sidebar
          "w-64"
        )}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <img src={acesLogo} alt="ACES" className="w-9 h-9 shrink-0 object-contain" />
        <div className={cn("overflow-hidden", collapsed && "hidden md:hidden", !collapsed && "block", "max-md:block")}>
          <h1 className="text-sm font-bold font-heading text-gold tracking-wide truncate">
            A.C.E.S.
          </h1>
          <p className="text-[10px] text-sidebar-foreground/50 truncate">
            BCP — Computer Engineering
          </p>
        </div>
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
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-gold/15 border border-gold/40 text-gold shadow-[0_0_0_1px_rgba(212,160,23,0.15)]"
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
              <span className={cn("truncate", collapsed && "md:hidden", "max-md:inline")}>{item.label}</span>
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium max-md:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}

        {/* Admin Section */}
        {role && role.permissions.length > 0 && (
          <>
            <div className="pt-3 pb-1">
              <p className={cn("px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30", collapsed && "md:hidden", "max-md:block")}>
                Admin
              </p>
              <Separator className={cn("bg-sidebar-border", !collapsed && "md:hidden", "max-md:hidden")} />
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);

              const link = (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-gold/15 border border-gold/40 text-gold shadow-[0_0_0_1px_rgba(212,160,23,0.15)]"
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
                  <span className={cn("truncate", collapsed && "md:hidden", "max-md:inline")}>{item.label}</span>
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium max-md:hidden">
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
            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-sidebar-accent/50 transition-colors group",
            collapsed ? "justify-center max-md:justify-start" : ""
          )}
          onClick={() => { onMobileClose(); user && navigate(`/members/${user._id}`); }}
          title="View my profile"
        >
          <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
            <AvatarFallback className="bg-navy-light text-gold text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex-1 min-w-0", collapsed && "md:hidden", "max-md:block")}>
            <p className="text-sm font-medium truncate">
              {user?.fullName}
              </p>
              <Badge
                variant="outline"
                className="mt-0.5 text-[10px] px-1.5 py-0 h-4 border-0 font-semibold"
                style={{
                  backgroundColor: `${role?.color}20`,
                  color: role?.color,
                }}
              >
                {role?.name}
              </Badge>
            </div>
          <button
            onClick={(e) => { e.stopPropagation(); logout(); }}
            className={cn("text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors", collapsed && "md:hidden", "max-md:block")}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Collapse Toggle - hidden on mobile */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-navy-light border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-gold hover:border-gold transition-all duration-200 shadow-md hidden md:flex"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
    </>
  );
}
