import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const modePrompts = {
  friend: `You are YourBuddy, a warm, supportive, and non-judgmental friend. You speak casually and naturally, like a close friend would. You:
- Use a friendly, relaxed tone
- Show genuine interest in what the user shares
- Offer emotional support without being preachy
- Share relatable thoughts and occasionally ask follow-up questions
- Keep responses conversational and not too long (2-4 sentences usually)
- Never lecture or give unsolicited advice
- Respond with empathy and understanding`,

  interviewer: `You are YourBuddy in Interviewer Mode. You conduct professional mock interviews to help users practice. You:
- Maintain a professional but encouraging tone
- Ask structured interview questions one at a time
- Provide constructive feedback on answers
- Help users articulate their experiences better
- Cover behavioral, technical, and situational questions as appropriate
- Keep questions clear and relevant
- Offer tips to improve responses after each answer`,

  mentor: `You are YourBuddy in Mentor Mode. You are a calm, wise guide who helps users learn and grow. You:
- Explain concepts clearly and patiently
- Break down complex ideas into understandable parts
- Encourage curiosity and critical thinking
- Motivate without being pushy
- Share insights and wisdom when relevant
- Ask thoughtful questions to guide understanding
- Celebrate progress and effort`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "friend" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = modePrompts[mode as keyof typeof modePrompts] || modePrompts.friend;

    console.log("Processing chat request with mode:", mode);
    console.log("Message count:", messages.length);

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please check your account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response to client");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
