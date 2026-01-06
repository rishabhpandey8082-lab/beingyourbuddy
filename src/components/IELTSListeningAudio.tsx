import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, Turtle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IELTSListeningAudioProps {
  text: string;
  language?: string;
  onComplete?: () => void;
  autoPlay?: boolean;
}

const IELTSListeningAudio = ({ text, language = "english", onComplete, autoPlay = false }: IELTSListeningAudioProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slowMode, setSlowMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const LANG_CONFIG: Record<string, { code: string; rate: number; slowRate: number }> = {
    english: { code: "en-US", rate: 0.95, slowRate: 0.7 },
    german: { code: "de-DE", rate: 0.9, slowRate: 0.65 },
    french: { code: "fr-FR", rate: 0.92, slowRate: 0.68 },
  };

  const cleanup = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    if (autoPlay && text) {
      setTimeout(() => playAudio(), 500);
    }
  }, [text, autoPlay]);

  const playWithBrowserTTS = useCallback(async () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Speech not supported in your browser");
      return;
    }

    cleanup();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    const config = LANG_CONFIG[language] || LANG_CONFIG.english;
    utterance.lang = config.code;
    utterance.rate = slowMode ? config.slowRate : config.rate;
    utterance.pitch = 1.0;
    
    // Select best voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = config.code.split("-")[0];
    const preferredVoice = 
      voices.find(v => v.lang.startsWith(langPrefix) && v.name.includes("Google")) ||
      voices.find(v => v.lang.startsWith(langPrefix) && !v.localService) ||
      voices.find(v => v.lang.startsWith(langPrefix));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Estimate duration (rough: ~150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60 * 1000 / (slowMode ? 0.7 : 1);
    let elapsed = 0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
      
      progressIntervalRef.current = setInterval(() => {
        elapsed += 100;
        const newProgress = Math.min((elapsed / estimatedDuration) * 100, 95);
        setProgress(newProgress);
      }, 100);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      onComplete?.();
    };

    utterance.onerror = (event) => {
      if (event.error !== "canceled") {
        toast.error("Audio playback error");
      }
      setIsPlaying(false);
      setIsLoading(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [text, language, slowMode, cleanup, onComplete]);

  const playAudio = async () => {
    if (isPlaying) {
      cleanup();
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Try to get session for ElevenLabs
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Use browser TTS for non-authenticated users
        await playWithBrowserTTS();
        return;
      }

      // Try ElevenLabs for higher quality
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            text: text.slice(0, 500), // Limit for API
            voiceId: language === "german" ? "onwK4e9ZLuTAKqWW03F9" : "EXAVITQu4vr4xnSDxMaL"
          }),
        }
      );

      if (!response.ok) {
        // Fallback to browser TTS
        await playWithBrowserTTS();
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      if (slowMode) {
        audio.playbackRate = 0.75;
      }

      audio.onloadedmetadata = () => {
        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime && audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        }, 100);
      };

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
        URL.revokeObjectURL(audioUrl);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        onComplete?.();
      };

      audio.onerror = async () => {
        setIsLoading(false);
        // Fallback to browser TTS
        await playWithBrowserTTS();
      };

      await audio.play();
    } catch (error) {
      console.error("Audio error:", error);
      // Fallback to browser TTS
      await playWithBrowserTTS();
    }
  };

  const replay = () => {
    cleanup();
    setProgress(0);
    setTimeout(() => playAudio(), 100);
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={playAudio}
          disabled={isLoading}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isPlaying
              ? "bg-gradient-to-br from-red-500 to-rose-500"
              : "bg-gradient-to-br from-blue-500 to-indigo-500"
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </motion.button>

        <div className="flex-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {isPlaying ? "Playing..." : progress === 100 ? "Complete" : "Click to play"}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={replay}
          disabled={isLoading}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant={slowMode ? "default" : "outline"}
          size="icon"
          className={`rounded-xl ${slowMode ? "bg-amber-500 hover:bg-amber-600" : ""}`}
          onClick={() => setSlowMode(!slowMode)}
          title="Slow mode"
        >
          <Turtle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default IELTSListeningAudio;
