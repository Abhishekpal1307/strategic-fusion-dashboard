import { createFileRoute } from "@tanstack/react-router";
import { Database, Cloud, Radio, Eye, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/dashboard/sources")({
  head: () => ({ meta: [{ title: "Sources — Strategic Fusion Dashboard" }] }),
  component: SourcesPage,
});

const SOURCES = [
  { name: "OSINT — Public web feeds", status: "active", icon: Radio, latency: "120ms", lastSync: "2m ago" },
  { name: "OSINT — MongoDB collection", status: "active", icon: Database, latency: "40ms", lastSync: "just now" },
  { name: "OSINT — AWS S3 archive", status: "idle", icon: Cloud, latency: "—", lastSync: "12m ago" },
  { name: "HUMINT — Field CSV intake", status: "active", icon: FileSpreadsheet, latency: "—", lastSync: "5m ago" },
  { name: "IMINT — Image dropbox", status: "active", icon: Eye, latency: "—", lastSync: "8m ago" },
];

function SourcesPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="text-sm text-muted-foreground">Configured ingestion pipelines.</p>
      </div>
      <div className="glass rounded-xl divide-y divide-border">
        {SOURCES.map((s) => (
          <div key={s.name} className="flex items-center gap-4 px-4 py-3">
            <div className="h-9 w-9 rounded-md bg-accent border border-border flex items-center justify-center text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">Last sync · {s.lastSync} · latency {s.latency}</div>
            </div>
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                s.status === "active"
                  ? "border-[color:var(--color-risk-low)] text-[color:var(--color-risk-low)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
