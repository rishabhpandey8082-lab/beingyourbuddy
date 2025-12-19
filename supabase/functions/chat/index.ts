import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
- Celebrate progress and effort`,

  studybuddy: `You are YourBuddy in Study Buddy Mode. You're an enthusiastic learning companion who makes studying fun. You:
- Help explain concepts in simple, memorable ways
- Create mnemonics and analogies to aid understanding
- Quiz the user on material when they ask
- Break down complex topics into digestible chunks
- Celebrate small wins and progress
- Suggest study techniques and strategies
- Keep energy up with encouraging words
- Ask if they want to test their knowledge`,

  therapist: `You are YourBuddy in Therapist Mode. You are a gentle, reflective companion who helps process emotions (you are NOT a medical professional). You:
- Create a safe, non-judgmental space for sharing
- Listen actively and reflect back what you hear
- Ask open-ended questions to encourage exploration
- Help identify and name emotions
- Suggest healthy coping strategies when appropriate
- Never diagnose or provide medical advice
- Encourage professional help when needed
- Use calming, measured language
- Validate feelings without fixing them`
};

// Simple emotion detection keywords
const emotionKeywords = {
  sad: ["sad", "depressed", "down", "unhappy", "crying", "tears", "lonely", "hopeless", "grief", "miss", "lost"],
  stressed: ["stressed", "anxious", "overwhelmed", "worried", "nervous", "panic", "pressure", "deadline", "too much"],
  confident: ["great", "amazing", "awesome", "excited", "happy", "confident", "proud", "achieved", "success", "won"],
  frustrated: ["frustrated", "angry", "annoyed", "irritated", "mad", "furious", "hate", "can't stand"],
  neutral: []
};

function detectEmotion(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return emotion;
    }
  }
  
  return "neutral";
}

function getEmotionalAdjustment(emotion: string): string {
  switch (emotion) {
    case "sad":
      return "\n\nNote: The user seems to be feeling down. Be extra gentle, warm, and supportive in your response. Acknowledge their feelings without being patronizing.";
    case "stressed":
      return "\n\nNote: The user seems stressed or anxious. Use a calm, reassuring tone. Help them feel grounded and offer perspective without dismissing their concerns.";
    case "confident":
      return "\n\nNote: The user seems in a positive mood. Match their energy and celebrate with them while staying genuine.";
    case "frustrated":
      return "\n\nNote: The user seems frustrated. Acknowledge their feelings, show understanding, and avoid being dismissive. Let them vent if needed.";
    default:
      return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

    const body = await req.json();
    const { messages, mode = "friend", userName, conversationContext } = body;

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 100) {
      return new Response(JSON.stringify({ error: "Too many messages (max 100)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Message too long (max 10000 chars)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.role && !["user", "assistant", "system"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (userName && (typeof userName !== "string" || userName.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid userName (max 100 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (conversationContext && (typeof conversationContext !== "string" || conversationContext.length > 1000)) {
      return new Response(JSON.stringify({ error: "Invalid conversationContext (max 1000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validModes = ["friend", "interviewer", "mentor", "studybuddy", "therapist", "language"];
    if (mode && !validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = modePrompts[mode as keyof typeof modePrompts] || modePrompts.friend;
    
    // Detect emotion from the latest user message
    const latestUserMessage = messages.filter((m: any) => m.role === "user").pop()?.content || "";
    const detectedEmotion = detectEmotion(latestUserMessage);
    const emotionalAdjustment = getEmotionalAdjustment(detectedEmotion);
    
    // Build context from conversation history
    let memoryContext = "";
    if (userName) {
      memoryContext += `\n\nThe user's name is ${userName}. Use their name occasionally (but not every message) to make the conversation more personal.`;
    }
    if (conversationContext) {
      memoryContext += `\n\nContext from earlier in this conversation: ${conversationContext}`;
    }

    const enhancedSystemPrompt = systemPrompt + memoryContext + emotionalAdjustment;

    console.log("Processing chat request with mode:", mode);
    console.log("Detected emotion:", detectedEmotion);
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
          { role: "system", content: enhancedSystemPrompt },
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
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "X-Detected-Emotion": detectedEmotion,
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
