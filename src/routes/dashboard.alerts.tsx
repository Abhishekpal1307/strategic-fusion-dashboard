import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useAlerts } from "@/hooks/use-alerts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Strategic Fusion Dashboard" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { user } = useAuth();
  const { alerts, unreadCount, markAllRead, clearAll } = useAlerts(user?.id);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[color:var(--color-risk-high)]" />
            High-risk alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            History of high-risk intel nodes ingested in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={alerts.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear history
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl divide-y divide-border">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <BellOff className="h-6 w-6" />
            No alerts in your history. New high-risk nodes will appear here automatically.
          </div>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-risk-high)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
              {a.source_type}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground">
                {a.region ?? "Unknown region"} · {format(new Date(a.created_at), "MMM d, yyyy HH:mm")}
              </div>
            </div>
            {!a.read && (
              <span className="text-[10px] uppercase tracking-wider text-primary">
                New
              </span>
            )}
            <Link
              to="/dashboard/map"
              className="text-xs text-primary hover:underline"
            >
              View on map
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
