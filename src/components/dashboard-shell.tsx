import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Upload,
  Database,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  Radar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/map", label: "Intelligence Map", icon: MapIcon },
  { to: "/dashboard/upload", label: "Upload Center", icon: Upload },
  { to: "/dashboard/sources", label: "Sources", icon: Database },
  { to: "/dashboard/reports", label: "Reports", icon: FileText },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [utc, setUtc] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const t = setInterval(() => setUtc(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={`${collapsed ? "w-16" : "w-60"} hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-200`}
      >
        <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
          <Radar className="h-5 w-5 text-primary" />
          {!collapsed && <span className="font-semibold tracking-wide text-sm">FUSION</span>}
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map((n) => {
            const active =
              location.pathname === n.to ||
              (n.to !== "/dashboard" && location.pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 flex items-center justify-center rounded-md border border-sidebar-border py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search intelligence node..." className="h-9 pl-8" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {user.email === "demo.analyst@fusion.ops" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Demo mode
              </span>
            )}
            <span className="hidden md:inline-block rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
              {utc.toISOString().replace("T", " ").slice(0, 19)} UTC
            </span>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-xs">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent" />
              <span className="font-medium">{user.email?.split("@")[0]}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
