import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateAnalystSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { data: nodes, error } = await supabase
      .from("intel_nodes")
      .select("title,source_type,risk_level,region,description,created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) throw new Error(error.message);
    if (!nodes || nodes.length === 0) {
      return { summary: "No intelligence nodes available for analysis." };
    }

    const compact = nodes
      .map(
        (n) =>
          `- [${n.risk_level.toUpperCase()}|${n.source_type}] ${n.region ?? "?"} — ${n.title}`,
      )
      .join("\n");

    const counts = nodes.reduce(
      (acc: Record<string, number>, n) => {
        acc[n.risk_level] = (acc[n.risk_level] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const prompt = `You are a defense intelligence analyst. Read the intelligence node feed below and produce a concise tactical situation summary in 3 to 4 short sentences. Identify the most pressing risk areas, any clusters by region, and what an analyst should monitor next. Be direct, precise, and avoid filler.

Risk distribution: ${JSON.stringify(counts)}

Recent nodes:
${compact}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior intelligence analyst. Output a single tight paragraph, no bullet lists, no preamble.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return { summary: "Rate limit reached on the AI gateway. Try again in a moment." };
    }
    if (resp.status === 402) {
      return {
        summary: "AI credits exhausted. Add funds at Settings → Workspace → Usage to continue.",
      };
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error(`AI gateway error ${resp.status}`);
    }

    const json = await resp.json();
    const summary: string =
      json.choices?.[0]?.message?.content ?? "Unable to generate summary.";

    return { summary };
  });
