import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: nodes, error } = await supabase
      .from("intel_nodes")
      .select("title,source_type,risk_level,region,description,created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) throw new Error(error.message);

    if (!nodes || nodes.length === 0) {
      // Return a tiny SSE stream with the no-data message
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const payload = JSON.stringify({
            choices: [{ delta: { content: "No intelligence nodes available for analysis." } }],
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const compact = nodes
      .map(
        (n: any) =>
          `- [${String(n.risk_level).toUpperCase()}|${n.source_type}] ${n.region ?? "?"} — ${n.title}`,
      )
      .join("\n");

    const counts = nodes.reduce((acc: Record<string, number>, n: any) => {
      acc[n.risk_level] = (acc[n.risk_level] ?? 0) + 1;
      return acc;
    }, {});

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
        stream: true,
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
      return new Response(
        JSON.stringify({ error: "Rate limit reached on the AI gateway. Try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (resp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add funds at Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!resp.ok || !resp.body) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: `AI gateway error ${resp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-summary-stream error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
