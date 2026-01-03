import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedTTSHook {
  speak: (text: string, language?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

// ElevenLabs voice IDs for different languages - native speakers
const VOICE_IDS: Record<string, string> = {
  english: "EXAVITQu4vr4xnSDxMaL", // Sarah - natural English
  german: "onwK4e9ZLuTAKqWW03F9", // Daniel - German native
  french: "XrExE9yKIg1WjnnlVkGX", // Matilda - French
  spanish: "IKne3meq5aSn9XLyUdCD", // Charlie - Spanish
  italian: "pFZP5JQG7iQjIQuC4Bku", // Lily - Italian
  hindi: "SAz9YHcvj6GT2YYXdXww", // River
  japanese: "cjVigY5qzO86Huf0OWal", // Eric
  korean: "iP95p4xoKVk53GoZ742B", // Chris
  portuguese: "bIHbv24MWmeRgasZH58o", // Will
  chinese: "N2lVS1w4EtoT3dr4eOWO", // Callum
  default: "EXAVITQu4vr4xnSDxMaL",
};

// Browser TTS language codes
const BROWSER_LANG_CODES: Record<string, string> = {
  english: "en-US",
  german: "de-DE",
  french: "fr-FR",
  spanish: "es-ES",
  italian: "it-IT",
  hindi: "hi-IN",
  japanese: "ja-JP",
  korean: "ko-KR",
  portuguese: "pt-BR",
  chinese: "zh-CN",
};

export const useEnhancedTTS = (): EnhancedTTSHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Clean text for better pronunciation
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove markdown
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/_/g, "")
      .replace(/#{1,6}\s/g, "")
      // Remove emojis for cleaner speech
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      // Limit length for better quality
      .slice(0, 500)
      .trim();
  };

  // Enhanced browser TTS with native voice selection
  const useBrowserTTS = useCallback((text: string, language: string = "english") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const cleanText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Set language
      utterance.lang = BROWSER_LANG_CODES[language] || "en-US";
      
      // More natural speech settings
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find a native voice for the language
      const voices = window.speechSynthesis.getVoices();
      const langCode = BROWSER_LANG_CODES[language] || "en";
      
      // Prefer Google or Microsoft voices, then any matching language
      const preferredVoice = voices.find(v => 
        v.lang.startsWith(langCode.split("-")[0]) && 
        (v.name.includes("Google") || v.name.includes("Microsoft"))
      ) || voices.find(v => v.lang.startsWith(langCode.split("-")[0]));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
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

  const speak = useCallback(async (text: string, language: string = "english") => {
    if (!text) return;

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

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

      // If not signed in, use browser TTS with language support
      if (!accessToken) {
        useBrowserTTS(cleanText, language);
        return;
      }

      // Get language-specific voice ID
      const voiceId = VOICE_IDS[language] || VOICE_IDS.default;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ 
            text: cleanText,
            voiceId: voiceId
          }),
        }
      );

      // Check if we need to fallback to browser TTS
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.fallback) {
          console.log("ElevenLabs unavailable, using browser TTS with native voice");
          useBrowserTTS(cleanText, language);
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
        // Fallback to browser TTS
        useBrowserTTS(cleanText, language);
      };

      await audio.play();
    } catch (err) {
      console.error("Enhanced TTS error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      // Fallback to browser TTS with language support
      useBrowserTTS(cleanText, language);
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
