import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI event detail extractor. The user will describe their event in natural language. Extract all event details and return ONLY a valid JSON object with these exact keys:
- eventType (string or null): the type of event (e.g. Wedding, Birthday Party, Corporate Event)
- guests (string or null): number of guests, use ~ prefix if approximate (e.g. "~200 people")
- budget (string or null): budget in ₹ format (e.g. "₹5,00,000")
- location (string or null): city or venue location
- formality (string or null): one of "Casual", "Semi-Formal", "Formal", "Black Tie"
- venue (string or null): venue type (e.g. "Hotel / Banquet Hall", "Home", "Outdoor")
- specialNotes (string or null): any special context, max 50 chars
- confidenceScore (number 0-100): based on how many key fields you could extract. Score guide: 1-2 fields = 20-35, 3-4 fields = 40-65, 5-6 fields = 70-85, 7+ fields = 90-100
- followUpQuestion (string or null): if confidence is below 70, ask ONE critical question that would most improve suggestion quality. If confidence >= 70, set to null.
- followUpOptions (array of strings or null): if followUpQuestion is set, provide 2-4 quick answer options. Otherwise null.
- scaleScore (number 0-100): event scale based on guest count, budget, and formality. 0-20 Intimate, 21-40 Small, 41-60 Medium, 61-80 Large, 81-100 Mega.

If a field cannot be determined from the description, return null for that field.
Return ONLY valid JSON, no markdown, no preamble.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let extraction;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extraction = JSON.parse(cleaned);
    } catch {
      extraction = { confidenceScore: 0, error: "Could not parse extraction" };
    }

    return new Response(JSON.stringify({ extraction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Event extract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
