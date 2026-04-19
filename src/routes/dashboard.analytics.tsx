import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIntelNodes } from "@/hooks/use-intel-nodes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Strategic Fusion Dashboard" }] }),
  component: AnalyticsPage,
});

const COLORS = ["oklch(0.72 0.18 230)", "oklch(0.78 0.18 160)", "oklch(0.78 0.16 80)", "oklch(0.66 0.22 25)"];

function AnalyticsPage() {
  const { user } = useAuth();
  const { nodes } = useIntelNodes(user?.id);

  const bySource = useMemo(() => {
    const m: Record<string, number> = { OSINT: 0, HUMINT: 0, IMINT: 0 };
    nodes.forEach((n) => (m[n.source_type] = (m[n.source_type] ?? 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [nodes]);

  const byRisk = useMemo(() => {
    const m: Record<string, number> = { high: 0, medium: 0, low: 0, verified: 0 };
    nodes.forEach((n) => (m[n.risk_level] = (m[n.risk_level] ?? 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [nodes]);

  const byRegion = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => m.set(n.region ?? "Unknown", (m.get(n.region ?? "Unknown") ?? 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [nodes]);

  const trend = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      const key = format(d, "MMM d");
      return { day: key, count: nodes.filter((n) => format(new Date(n.created_at), "MMM d") === key).length };
    });
  }, [nodes]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Quantitative slice of your intelligence corpus.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Nodes by source type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.04 250 / 0.3)" />
              <XAxis dataKey="name" stroke="oklch(0.7 0.02 240)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.02 240)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="value" fill="oklch(0.72 0.18 230)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Threat level distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byRisk} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} stroke="none">
                {byRisk.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Region-wise incidents">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byRegion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.04 250 / 0.3)" />
              <XAxis type="number" stroke="oklch(0.7 0.02 240)" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="oklch(0.7 0.02 240)" fontSize={11} width={90} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="value" fill="oklch(0.78 0.18 160)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="14-day upload trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.04 250 / 0.3)" />
              <XAxis dataKey="day" stroke="oklch(0.7 0.02 240)" fontSize={11} />
              <YAxis stroke="oklch(0.7 0.02 240)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Line type="monotone" dataKey="count" stroke="oklch(0.72 0.18 230)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

const tipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}
