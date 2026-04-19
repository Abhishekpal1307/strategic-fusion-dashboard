import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Layers,
  Flame,
  Globe,
  Mountain,
  Maximize2,
  Minimize2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIntelNodes } from "@/hooks/use-intel-nodes";
import { IntelMap } from "@/components/intel-map";
import type { IntelNode, RiskLevel, SourceType } from "@/lib/intel-types";
import { RISK_LABEL, SOURCE_LABEL } from "@/lib/intel-types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/map")({
  head: () => ({ meta: [{ title: "Intelligence Map — Strategic Fusion Dashboard" }] }),
  component: MapPage,
});

const RISKS: RiskLevel[] = ["high", "medium", "low", "verified"];
const SOURCES: SourceType[] = ["OSINT", "HUMINT", "IMINT"];
type Style = "dark" | "satellite" | "terrain";

function MapPage() {
  const { user } = useAuth();
  const { nodes } = useIntelNodes(user?.id);
  const [style, setStyle] = useState<Style>("dark");
  const [risks, setRisks] = useState<RiskLevel[]>([...RISKS]);
  const [sources, setSources] = useState<SourceType[]>([...SOURCES]);
  const [heat, setHeat] = useState(false);
  const [cluster, setCluster] = useState(true);
  const [selected, setSelected] = useState<IntelNode | null>(null);
  const [full, setFull] = useState(false);

  const visibleCount = useMemo(
    () => nodes.filter((n) => risks.includes(n.risk_level) && sources.includes(n.source_type)).length,
    [nodes, risks, sources],
  );

  function toggle<T>(arr: T[], v: T, set: (x: T[]) => void) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <div
      className={`${full ? "fixed inset-0 z-50 bg-background" : "relative h-[calc(100vh-3.5rem)]"} overflow-hidden`}
    >
      <IntelMap
        nodes={nodes}
        filterRisks={risks}
        filterSources={sources}
        showHeatmap={heat}
        showClusters={cluster}
        style={style}
        onSelect={setSelected}
      />

      {/* Top control bar */}
      <div className="absolute left-3 top-3 right-3 z-10 flex flex-wrap items-center gap-2">
        <div className="glass rounded-lg p-1 flex items-center gap-1">
          <StyleBtn active={style === "dark"} onClick={() => setStyle("dark")} icon={Layers} label="Dark" />
          <StyleBtn active={style === "satellite"} onClick={() => setStyle("satellite")} icon={Globe} label="Satellite" />
          <StyleBtn active={style === "terrain"} onClick={() => setStyle("terrain")} icon={Mountain} label="Terrain" />
        </div>
        <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5"><Switch checked={heat} onCheckedChange={setHeat} /> Heatmap</label>
          <label className="flex items-center gap-1.5"><Switch checked={cluster} onCheckedChange={setCluster} /> Cluster</label>
        </div>
        <div className="glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">{visibleCount} of {nodes.length} visible</span>
        </div>
        <Button size="icon" variant="outline" className="ml-auto glass" onClick={() => setFull((f) => !f)}>
          {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filters bottom-left */}
      <div className="absolute left-3 bottom-3 z-10 glass rounded-lg p-3 max-w-xs">
        <div className="text-xs font-medium mb-2 text-muted-foreground">Filters</div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Risk</div>
            <div className="flex flex-wrap gap-1">
              {RISKS.map((r) => (
                <button
                  key={r}
                  onClick={() => toggle(risks, r, setRisks)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                    risks.includes(r) ? "bg-accent border-border" : "border-border opacity-50"
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                    style={{
                      background:
                        r === "high"
                          ? "var(--color-risk-high)"
                          : r === "medium"
                            ? "var(--color-risk-medium)"
                            : r === "low"
                              ? "var(--color-risk-low)"
                              : "var(--color-risk-verified)",
                    }}
                  />
                  {RISK_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Source</div>
            <div className="flex flex-wrap gap-1">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(sources, s, setSources)}
                  className={`text-[11px] px-2 py-1 rounded-md border ${
                    sources.includes(s) ? "bg-accent border-border" : "border-border opacity-50"
                  }`}
                >
                  {SOURCE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div className="absolute right-3 top-16 bottom-3 z-10 w-[320px] max-w-[88vw] glass rounded-lg p-4 overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selected.source_type}</Badge>
                <Badge
                  style={{
                    background:
                      selected.risk_level === "high"
                        ? "var(--color-risk-high)"
                        : selected.risk_level === "medium"
                          ? "var(--color-risk-medium)"
                          : selected.risk_level === "low"
                            ? "var(--color-risk-low)"
                            : "var(--color-risk-verified)",
                    color: "white",
                  }}
                >
                  {RISK_LABEL[selected.risk_level]}
                </Badge>
              </div>
              <h3 className="mt-2 font-semibold">{selected.title}</h3>
              <div className="text-xs text-muted-foreground">
                {selected.region} · {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setSelected(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selected.image_url ? (
            <img
              src={selected.image_url}
              alt={selected.title}
              className="mt-3 w-full h-40 object-cover rounded-md border border-border"
            />
          ) : (
            <div className="mt-3 w-full h-40 rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Description</div>
              <p className="mt-1">{selected.description ?? "—"}</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Analyst notes</div>
              <p className="mt-1">{selected.notes ?? "—"}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Created {new Date(selected.created_at).toUTCString()}
            </div>
          </div>
        </div>
      )}

      {/* Legend bottom-right */}
      <div className="absolute right-3 bottom-3 z-10 glass rounded-lg px-3 py-2 text-[11px] flex items-center gap-3">
        {RISKS.map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background:
                  r === "high"
                    ? "var(--color-risk-high)"
                    : r === "medium"
                      ? "var(--color-risk-medium)"
                      : r === "low"
                        ? "var(--color-risk-low)"
                        : "var(--color-risk-verified)",
              }}
            />
            {RISK_LABEL[r]}
          </span>
        ))}
      </div>
    </div>
  );
}

function StyleBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
