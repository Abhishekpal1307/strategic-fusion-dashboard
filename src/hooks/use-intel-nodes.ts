import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IntelNode } from "@/lib/intel-types";
import { SEED_NODES } from "@/lib/seed-data";

export function useIntelNodes(userId: string | undefined) {
  const [nodes, setNodes] = useState<IntelNode[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("intel_nodes")
      .select("*")
      .order("created_at", { ascending: false });
    setNodes((data ?? []) as IntelNode[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from("intel_nodes").select("*").order("created_at", { ascending: false });
      if (!data || data.length === 0) {
        await supabase.from("intel_nodes").insert(
          SEED_NODES.map((n) => ({ ...n, user_id: userId })),
        );
        const { data: after } = await supabase
          .from("intel_nodes")
          .select("*")
          .order("created_at", { ascending: false });
        setNodes((after ?? []) as IntelNode[]);
      } else {
        setNodes(data as IntelNode[]);
      }
      setLoading(false);
    })();

    const ch = supabase
      .channel("intel-nodes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "intel_nodes" }, () => refresh())
      .subscribe();

    const t = setInterval(refresh, 10000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, [userId, refresh]);

  return { nodes, loading, refresh };
}
