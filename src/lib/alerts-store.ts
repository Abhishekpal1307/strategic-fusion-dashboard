import type { IntelNode } from "@/lib/intel-types";

export interface AlertEntry {
  id: string;
  node_id: string;
  title: string;
  region: string | null;
  source_type: string;
  risk_level: string;
  created_at: string;
  read: boolean;
}

const KEY = (uid: string) => `fusion.alerts.${uid}`;
const SEEN_KEY = (uid: string) => `fusion.alerts.seen.${uid}`;

export function loadAlerts(userId: string): AlertEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(userId));
    return raw ? (JSON.parse(raw) as AlertEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(userId: string, alerts: AlertEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(userId), JSON.stringify(alerts.slice(0, 200)));
}

export function loadSeen(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function saveSeen(userId: string, seen: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY(userId), JSON.stringify([...seen].slice(-500)));
}

export function alertFromNode(n: IntelNode): AlertEntry {
  return {
    id: `a-${n.id}`,
    node_id: n.id,
    title: n.title,
    region: n.region,
    source_type: n.source_type,
    risk_level: n.risk_level,
    created_at: n.created_at,
    read: false,
  };
}
