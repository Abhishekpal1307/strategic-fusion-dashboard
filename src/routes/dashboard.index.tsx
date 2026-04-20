import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Eye,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIntelNodes } from "@/hooks/use-intel-nodes";
import { Button } from "@/components/ui/button";
import { NodeDetailDrawer } from "@/components/node-detail-drawer";
import type { IntelNode } from "@/lib/intel-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview — Strategic Fusion Dashboard" }] }),
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const { nodes, refresh } = useIntelNodes(user?.id);
  const [selected, setSelected] = useState<IntelNode | null>(null);
  const [summary, setSummary] = useState<string>(
    "Awaiting AI analyst summary. Click Generate to produce a tactical situation paragraph from the live feed.",
  );
  const [aiLoading, setAiLoading] = useState(false);

  const stats = useMemo(() => {
    const total = nodes.length;
    const high = nodes.filter((n) => n.risk_level === "high").length;
    const verified = nodes.filter((n) => n.risk_level === "verified").length;
    const sources = new Set(nodes.map((n) => n.source_type)).size;
    return { total, high, verified, sources };
  }, [nodes]);

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "MMM d");
      const count = nodes.filter(
        (n) => format(new Date(n.created_at), "MMM d") === key,
      ).length;
      return { day: key, count };
    });
    return days;
  }, [nodes]);

  const hotspots = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => m.set(n.region ?? "Unknown", (m.get(n.region ?? "Unknown") ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [nodes]);

  async function genSummary() {
    setAiLoading(true);
    setSummary("");
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-summary-stream`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });

      if (resp.status === 429) {
        toast.error("Rate limit reached. Try again in a moment.");
        setSummary("Rate limit reached on the AI gateway. Try again in a moment.");
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted.");
        setSummary("AI credits exhausted. Add funds at Settings → Workspace → Usage to continue.");
        return;
      }
      if (!resp.ok || !resp.body) {
        throw new Error(`Stream failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let acc = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content: string | undefined = parsed.choices?.[0]?.delta?.content;
            if (content) {
              acc += content;
              setSummary(acc);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      setSummary(e instanceof Error ? e.message : "Failed to generate summary.");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    if (nodes.length > 0 && summary.startsWith("Awaiting")) {
      genSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operational overview</h1>
          <p className="text-sm text-muted-foreground">Live tactical picture across all sources.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary border border-border">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">AI analyst summary</div>
              <Button size="sm" variant="ghost" onClick={genSummary} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total nodes" value={stats.total} icon={Database} />
        <Kpi label="High risk" value={stats.high} icon={AlertTriangle} accent="text-[color:var(--color-risk-high)]" />
        <Kpi label="Verified" value={stats.verified} icon={CheckCircle2} accent="text-primary" />
        <Kpi label="Active sources" value={stats.sources} icon={Activity} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">7-day ingest trend</h3>
            <span className="text-xs text-muted-foreground">Auto-refresh · 10s</span>
          </div>
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 230)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 230)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.04 250 / 0.3)" />
                <XAxis dataKey="day" stroke="oklch(0.7 0.02 240)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 240)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="oklch(0.72 0.18 230)" fill="url(#trend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-medium">Top hotspots</h3>
          <div className="mt-3 space-y-2">
            {hotspots.length === 0 && (
              <div className="text-sm text-muted-foreground">No regions yet.</div>
            )}
            {hotspots.map(([region, count], i) => (
              <div key={region} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-4">{i + 1}</span>
                <span className="flex-1 text-sm">{region}</span>
                <span className="text-xs rounded-md bg-accent px-2 py-0.5">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Recent feed</h3>
          <span className="text-xs text-muted-foreground">{nodes.length} total</span>
        </div>
        <div className="mt-3 divide-y divide-border">
          {nodes.slice(0, 8).map((n) => (
            <button
              key={n.id}
              onClick={() => setSelected(n)}
              className="w-full flex items-center gap-3 py-2 text-sm text-left hover:bg-accent/40 -mx-2 px-2 rounded-md transition-colors"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{
                  background:
                    n.risk_level === "high"
                      ? "var(--color-risk-high)"
                      : n.risk_level === "medium"
                        ? "var(--color-risk-medium)"
                        : n.risk_level === "low"
                          ? "var(--color-risk-low)"
                          : "var(--color-risk-verified)",
                }}
              />
              <span className="font-mono text-[10px] text-muted-foreground rounded bg-muted px-1.5 py-0.5">
                {n.source_type}
              </span>
              <span className="flex-1 truncate">{n.title}</span>
              <span className="hidden md:inline text-xs text-muted-foreground">{n.region}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(n.created_at), "MMM d, HH:mm")}
              </span>
            </button>
          ))}
          {nodes.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" /> No nodes yet — head to Upload Center.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
