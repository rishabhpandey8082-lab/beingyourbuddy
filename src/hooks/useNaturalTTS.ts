import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NaturalTTSHook {
  speak: (text: string, language?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

// Browser TTS language codes with native voices
const BROWSER_LANG_CONFIG: Record<string, { code: string; rate: number }> = {
  english: { code: "en-US", rate: 0.92 },
  german: { code: "de-DE", rate: 0.88 }, // Slower for better German pronunciation
  french: { code: "fr-FR", rate: 0.90 },
  spanish: { code: "es-ES", rate: 0.90 },
  italian: { code: "it-IT", rate: 0.90 },
  hindi: { code: "hi-IN", rate: 0.88 },
  japanese: { code: "ja-JP", rate: 0.85 },
  korean: { code: "ko-KR", rate: 0.85 },
  portuguese: { code: "pt-BR", rate: 0.90 },
  chinese: { code: "zh-CN", rate: 0.85 },
};

// ElevenLabs voice IDs for native speakers
const ELEVENLABS_VOICES: Record<string, string> = {
  english: "EXAVITQu4vr4xnSDxMaL", // Sarah
  german: "onwK4e9ZLuTAKqWW03F9", // Daniel
  french: "XrExE9yKIg1WjnnlVkGX", // Matilda
  spanish: "IKne3meq5aSn9XLyUdCD", // Charlie
  italian: "pFZP5JQG7iQjIQuC4Bku", // Lily
  default: "EXAVITQu4vr4xnSDxMaL",
};

export const useNaturalTTS = (): NaturalTTSHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean text for better pronunciation
  const cleanText = (text: string): string => {
    return text
      // Remove markdown
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/_/g, "")
      .replace(/#{1,6}\s/g, "")
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      // Limit length for quality
      .slice(0, 400)
      .trim();
  };

  // High-quality browser TTS with native voice selection
  const useBrowserTTS = useCallback((text: string, language: string = "english"): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const cleanedText = cleanText(text);
      if (!cleanedText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utteranceRef.current = utterance;
      
      const config = BROWSER_LANG_CONFIG[language] || BROWSER_LANG_CONFIG.english;
      utterance.lang = config.code;
      utterance.rate = config.rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Wait for voices to load, then select best native voice
      const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const langPrefix = config.code.split("-")[0];
        
        // Prioritize high-quality voices
        const preferredVoice = 
          // First try Google voices (usually best quality)
          voices.find(v => v.lang.startsWith(langPrefix) && v.name.includes("Google")) ||
          // Then Microsoft voices
          voices.find(v => v.lang.startsWith(langPrefix) && v.name.includes("Microsoft")) ||
          // Then any native voice for the language
          voices.find(v => v.lang.startsWith(langPrefix) && !v.localService) ||
          // Fallback to any matching voice
          voices.find(v => v.lang.startsWith(langPrefix));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      };

      // Try to select voice immediately
      selectVoice();
      
      // If voices not loaded yet, wait and try again
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = selectVoice;
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setIsLoading(false);
        if (event.error !== "canceled") {
          reject(new Error(`Speech error: ${event.error}`));
        } else {
          resolve();
        }
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speak = useCallback(async (text: string, language: string = "english") => {
    if (!text) return;

    const cleanedText = cleanText(text);
    if (!cleanedText) return;

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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // If not signed in, use browser TTS directly
      if (!accessToken) {
        await useBrowserTTS(cleanedText, language);
        return;
      }

      // Try ElevenLabs for higher quality
      const voiceId = ELEVENLABS_VOICES[language] || ELEVENLABS_VOICES.default;

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
            text: cleanedText,
            voiceId: voiceId
          }),
        }
      );

      // Fallback to browser TTS if ElevenLabs fails
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.fallback) {
          console.log("Using browser TTS for native voice");
        }
        await useBrowserTTS(cleanedText, language);
        return;
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

      audio.onerror = async () => {
        setIsSpeaking(false);
        setIsLoading(false);
        // Fallback to browser TTS
        await useBrowserTTS(cleanedText, language);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Fallback to browser TTS
      try {
        await useBrowserTTS(cleanedText, language);
      } catch (browserErr) {
        console.error("Browser TTS fallback failed:", browserErr);
        setIsLoading(false);
      }
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
