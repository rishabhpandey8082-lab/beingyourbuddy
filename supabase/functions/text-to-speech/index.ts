import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS configuration - restrict origins in production
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    Deno.env.get("ALLOWED_ORIGIN") || "",
    "https://lovable.dev",
    "https://gptengineer.app",
  ].filter(Boolean);
  
  if (requestOrigin && allowedOrigins.some(allowed => requestOrigin.startsWith(allowed.replace(/\/$/, '')))) {
    return requestOrigin;
  }
  
  if (!Deno.env.get("ALLOWED_ORIGIN") && requestOrigin) {
    return requestOrigin;
  }
  
  return allowedOrigins[0] || "*";
};

const getCorsHeaders = (req: Request) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(req.headers.get("Origin")),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true",
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate request ID for log correlation (no PII)
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // Optional authentication: allow guests (no Authorization header)
    const authHeader = req.headers.get("Authorization");
    let user: any = null;

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data, error } = await supabaseClient.auth.getUser();
      if (!error) {
        user = data.user;
      }
    }

    console.log(`[${requestId}] Processing TTS request (${user ? "authed" : "guest"})`);

    const body = await req.json();
    const { text, voiceId = "EXAVITQu4vr4xnSDxMaL" } = body;

    // Input validation
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: "Text too long (max 5000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (voiceId && (typeof voiceId !== "string" || voiceId.length > 50)) {
      return new Response(JSON.stringify({ error: "Invalid voiceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      console.error(`[${requestId}] Configuration error: API key missing`);
      throw new Error("Service configuration error");
    }

    console.log(`[${requestId}] Generating speech, length: ${text.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`[${requestId}] External API error: ${response.status}`);
      
      // Return a specific error for rate limiting so client can fallback
      return new Response(
        JSON.stringify({ 
          error: "Speech service unavailable", 
          fallback: true,
          text: text // Send text back so client can use browser TTS
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] Speech generated successfully`);

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error(`[${requestId}] TTS error:`, error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
