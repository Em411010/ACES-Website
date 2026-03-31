import { useLocation } from "react-router-dom";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/billboard": "Billboard",
  "/tasks": "Task Board",
  "/documents": "Document Vault",
  "/chain": "Chain of Command",
  "/id": "Digital ID",
  "/admin/roles": "Role Manager",
  "/admin/members": "Member Directory",
};

export function TopBar() {
  const location = useLocation();
  const [dark, setDark] = useState(false);

  const title = pageTitles[location.pathname] || "ACES";

  function toggleTheme() {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  }

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold font-heading text-foreground">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search size={18} />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell size={18} />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground border-2 border-background">
            3
          </Badge>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>
    </header>
  );
}
