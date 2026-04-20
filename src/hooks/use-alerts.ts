import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { createElement } from "react";
import type { IntelNode } from "@/lib/intel-types";
import {
  alertFromNode,
  loadAlerts,
  loadSeen,
  saveAlerts,
  saveSeen,
  type AlertEntry,
} from "@/lib/alerts-store";
import { playAlertBeep } from "@/lib/alert-sound";

export function useAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Load persisted state when user changes
  useEffect(() => {
    if (!userId) {
      setAlerts([]);
      seenRef.current = new Set();
      initializedRef.current = false;
      return;
    }
    setAlerts(loadAlerts(userId));
    seenRef.current = loadSeen(userId);
    initializedRef.current = false; // re-bootstrap below
  }, [userId]);

  const ingest = useCallback(
    (node: IntelNode, opts: { silent?: boolean } = {}) => {
      if (!userId) return;
      if (node.risk_level !== "high") return;
      if (seenRef.current.has(node.id)) return;

      seenRef.current.add(node.id);
      saveSeen(userId, seenRef.current);

      const entry = alertFromNode(node);
      setAlerts((prev) => {
        const next = [entry, ...prev].slice(0, 200);
        saveAlerts(userId, next);
        return next;
      });

      if (!opts.silent) {
        playAlertBeep();
        toast.error(`High-risk node: ${node.title}`, {
          description: `${node.source_type} · ${node.region ?? "Unknown region"}`,
          icon: createElement(AlertTriangle, { className: "h-4 w-4" }),
          duration: 6000,
        });
      }
    },
    [userId],
  );

  // Bootstrap: mark all currently-existing high-risk nodes as seen WITHOUT
  // toasting, so we only alert on genuinely new inserts after page load.
  useEffect(() => {
    if (!userId || initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      const { data } = await supabase
        .from("intel_nodes")
        .select("id")
        .eq("risk_level", "high");
      if (data) {
        data.forEach((row) => seenRef.current.add(row.id as string));
        saveSeen(userId, seenRef.current);
      }
    })();

    const ch = supabase
      .channel(`intel-nodes-alerts-${userId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "intel_nodes" },
        (payload) => {
          const node = payload.new as IntelNode;
          ingest(node);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, ingest]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAllRead = useCallback(() => {
    if (!userId) return;
    setAlerts((prev) => {
      const next = prev.map((a) => ({ ...a, read: true }));
      saveAlerts(userId, next);
      return next;
    });
  }, [userId]);

  const clearAll = useCallback(() => {
    if (!userId) return;
    setAlerts([]);
    saveAlerts(userId, []);
  }, [userId]);

  return { alerts, unreadCount, markAllRead, clearAll };
}
