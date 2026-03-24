import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { details } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt =
      "You are an expert Indian event planner with 15 years of experience planning events across Mumbai, Delhi, Bangalore, and other major Indian cities. You have deep knowledge of Indian vendors, apps, platforms, discount strategies, payment hacks, and cost-saving tricks specific to India.
Based on the event details provided, give exactly 5 highly detailed, actionable suggestions. Each suggestion must be hyper-specific to their exact budget in ₹, guest count, city, formality level, and venue type.
For each suggestion you MUST include:
- Specific Indian platforms/apps where relevant (Swiggy, Zomato, BookMyShow, UrbanClap, WedMeGood, Sulekha, Amazon, Meesho, Blinkit, PhonePe, Paytm)
- Specific payment hacks (which bank cards give cashback, UPI offers, HDFC/ICICI/SBI card discounts)
- Exact estimated savings in ₹ where possible
- Specific timing tips (book X weeks in advance, order during sale, etc)
- Real alternatives with price comparisons
Format your response as a JSON array of exactly 5 objects with these keys:
- category: one of (Venue / Food / Decor / Entertainment / Budget)
- title: short punchy title (max 8 words)
- detail: detailed 4-5 sentence advice with specific platforms, amounts, and hacks
- saving: estimated saving amount as string like 'Save ₹3,000–5,000'
- tip: one single ultra-specific pro tip in 1 sentence starting with 💡
Return ONLY valid JSON array. No markdown. No preamble";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: details },
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
    const content = data.choices?.[0]?.message?.content || "[]";

    let suggestions;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = [{ category: "Budget", title: "Analysis unavailable", advice: "Could not parse AI response. Please try again." }];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Event suggester error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
