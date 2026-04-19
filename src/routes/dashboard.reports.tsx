import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIntelNodes } from "@/hooks/use-intel-nodes";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Layers3, MapPin, FileDown, FileText } from "lucide-react";
import { format } from "date-fns";
import type { IntelNode } from "@/lib/intel-types";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports — Strategic Fusion Dashboard" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  const { nodes } = useIntelNodes(user?.id);

  const high = useMemo(() => nodes.filter((n) => n.risk_level === "high").slice(0, 6), [nodes]);
  const recent = useMemo(() => nodes.slice(0, 6), [nodes]);
  const clusters = useMemo(() => detectClusters(nodes), [nodes]);
  const topZones = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => m.set(n.region ?? "Unknown", (m.get(n.region ?? "Unknown") ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [nodes]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analyst reports</h1>
          <p className="text-sm text-muted-foreground">Curated cards and exportable summaries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(nodes)}>
            <FileDown className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => exportPdf(nodes)}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon={AlertTriangle} title="High priority locations" accent="text-[color:var(--color-risk-high)]">
          {high.length === 0 ? <Empty /> : high.map((n) => <Row key={n.id} n={n} />)}
        </Card>
        <Card icon={Clock} title="Recent uploads">
          {recent.length === 0 ? <Empty /> : recent.map((n) => <Row key={n.id} n={n} />)}
        </Card>
        <Card icon={Layers3} title="Suspicious clusters">
          {clusters.length === 0 ? (
            <Empty msg="No clusters detected (≥3 nodes within ~80km)." />
          ) : (
            clusters.map((c, i) => (
              <div key={i} className="py-2 text-sm flex items-center gap-2">
                <span className="rounded bg-accent px-2 py-0.5 text-xs">{c.count} nodes</span>
                <span>near {c.center}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </Card>
        <Card icon={MapPin} title="Top active zones">
          {topZones.length === 0 ? <Empty /> : topZones.map(([region, count]) => (
            <div key={region} className="flex items-center gap-3 py-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="flex-1">{region}</span>
              <span className="text-xs rounded bg-accent px-2 py-0.5">{count}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ n }: { n: IntelNode }) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span
        className="h-2 w-2 rounded-full"
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
      <span className="font-mono text-[10px] rounded bg-muted px-1.5 py-0.5">{n.source_type}</span>
      <span className="flex-1 truncate">{n.title}</span>
      <span className="hidden md:inline text-xs text-muted-foreground">{n.region}</span>
      <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d")}</span>
    </div>
  );
}

function Empty({ msg = "No data yet." }: { msg?: string }) {
  return <div className="py-6 text-sm text-muted-foreground text-center">{msg}</div>;
}

// ----- helpers -----
function detectClusters(nodes: IntelNode[]) {
  const out: { center: string; count: number; lat: number; lng: number }[] = [];
  const used = new Set<string>();
  for (const n of nodes) {
    if (used.has(n.id)) continue;
    const near = nodes.filter(
      (m) => Math.abs(m.latitude - n.latitude) < 0.8 && Math.abs(m.longitude - n.longitude) < 0.8,
    );
    if (near.length >= 3) {
      near.forEach((x) => used.add(x.id));
      out.push({
        center: n.region ?? `${n.latitude.toFixed(2)},${n.longitude.toFixed(2)}`,
        count: near.length,
        lat: n.latitude,
        lng: n.longitude,
      });
    }
  }
  return out.slice(0, 6);
}

function exportCsv(nodes: IntelNode[]) {
  const header = ["title", "source_type", "risk_level", "latitude", "longitude", "region", "created_at"];
  const rows = nodes.map((n) =>
    header
      .map((k) => {
        const v = (n as unknown as Record<string, unknown>)[k];
        const s = v == null ? "" : String(v);
        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fusion-report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportPdf(nodes: IntelNode[]) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Fusion Report</title>
    <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111;}h1{margin:0 0 6px}h2{margin:24px 0 8px;font-size:14px;}table{width:100%;border-collapse:collapse;font-size:12px;}th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}</style>
    </head><body>
    <h1>Strategic Fusion — Analyst Report</h1>
    <div style="color:#666;font-size:12px">Generated ${new Date().toUTCString()} · ${nodes.length} nodes</div>
    <h2>Intelligence nodes</h2>
    <table><thead><tr><th>Title</th><th>Source</th><th>Risk</th><th>Region</th><th>Lat</th><th>Lng</th><th>Date</th></tr></thead><tbody>
    ${nodes
      .map(
        (n) =>
          `<tr><td>${escape(n.title)}</td><td>${n.source_type}</td><td>${n.risk_level}</td><td>${escape(n.region ?? "")}</td><td>${n.latitude.toFixed(3)}</td><td>${n.longitude.toFixed(3)}</td><td>${new Date(n.created_at).toISOString().slice(0, 10)}</td></tr>`,
      )
      .join("")}
    </tbody></table>
    <script>window.onload=()=>setTimeout(()=>window.print(),200);</script>
    </body></html>`);
  w.document.close();
}

function escape(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
