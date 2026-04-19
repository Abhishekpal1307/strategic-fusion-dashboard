import { createFileRoute, Link } from "@tanstack/react-router";
import { Radar, Globe2, Image as ImageIcon, ShieldAlert, Workflow, Layers, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Strategic Fusion Dashboard — Multi-source intelligence platform" },
      {
        name: "description",
        content:
          "Fuse OSINT, HUMINT and IMINT into one operational map. Live geospatial visualization, hover image intelligence, and threat prioritization for analysts.",
      },
      { property: "og:title", content: "Strategic Fusion Dashboard" },
      { property: "og:description", content: "Unified multi-source intelligence platform for analysts." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Layers, title: "Multi-source ingestion", body: "OSINT, HUMINT and IMINT pipelines unified into a single typed schema." },
  { icon: Globe2, title: "Live geospatial view", body: "Leaflet map with dark, satellite and terrain basemaps and live updates." },
  { icon: ImageIcon, title: "Hover image intel", body: "Hover any node for an instant image preview and metadata snapshot." },
  { icon: ShieldAlert, title: "Threat prioritization", body: "Risk-tiered markers with pulsing critical nodes and AI-assisted summaries." },
  { icon: Workflow, title: "Fast analyst workflow", body: "Drag-drop ingest, cluster filters, side-panel deep dives, CSV/PDF export." },
  { icon: Radar, title: "Always-on awareness", body: "Auto-refresh feed every 10s with realtime DB sync." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-glow)" }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-md bg-card flex items-center justify-center border border-border">
            <Radar className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-wide">FUSION</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="sm" className="glow-primary">Launch dashboard</Button>
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live operational feed
        </div>
        <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight">
          Unified Multi-Source <span className="text-gradient">Intelligence Platform</span>
        </h1>
        <p className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-muted-foreground">
          Fuse reports, imagery, geospatial data, and field intelligence into one operational picture.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard">
            <Button size="lg" className="glow-primary">
              Launch dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              <PlayCircle className="mr-2 h-4 w-4" /> Watch demo
            </Button>
          </Link>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="glass rounded-2xl p-2 overflow-hidden">
            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden bg-card">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-40 w-40">
                  <div className="absolute inset-0 rounded-full border border-primary/40" />
                  <div className="absolute inset-4 rounded-full border border-primary/30" />
                  <div className="absolute inset-8 rounded-full border border-primary/20" />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary glow-primary" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-1 -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-primary/70 to-transparent animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              <div className="absolute inset-0 scan-line" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 pb-24">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Built for operations centers</h2>
        <p className="mt-2 text-muted-foreground">Premium analyst tooling, opinionated defaults, zero ceremony.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary border border-border">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 md:px-10 py-6 text-xs text-muted-foreground flex justify-between">
        <span>© Strategic Fusion · For analyst use</span>
        <span className="font-mono">v1.0.0 · classified-grade UI</span>
      </footer>
    </div>
  );
}
