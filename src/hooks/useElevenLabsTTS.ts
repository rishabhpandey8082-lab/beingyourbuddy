import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ElevenLabsTTSHook {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useElevenLabsTTS = (): ElevenLabsTTSHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Helper function for browser TTS fallback
  const useBrowserTTS = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsLoading(false);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    setIsLoading(true);
    setError(null);

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // If not signed in, gracefully fallback to browser TTS (keeps app usable)
      if (!accessToken) {
        useBrowserTTS(text);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      // Check if we need to fallback to browser TTS
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.fallback) {
          // ElevenLabs unavailable, use browser TTS silently
          console.log("ElevenLabs unavailable, using browser TTS");
          useBrowserTTS(text);
          return;
        }
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        setError("Failed to play audio");
      };

      await audio.play();
    } catch (err) {
      console.error("ElevenLabs TTS error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      // Fallback to browser TTS
      useBrowserTTS(text);
    }
  }, [useBrowserTTS]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    // Also stop browser TTS if it was used as fallback
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    error,
  };
};
