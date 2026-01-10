import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface RobustSpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  hasResult: boolean;
  error: string | null;
  failedAttempts: number;
  retryVoice: () => void;
  useTextFallback: boolean;
  setUseTextFallback: (use: boolean) => void;
}

/**
 * Robust Speech Recognition Hook with Text Fallback
 * 
 * Key improvements:
 * - Auto text fallback after 2 failed attempts
 * - Clear visual and audio feedback
 * - Reliable single sentence capture
 * - Better error handling
 * - Prevents duplicate/stretched words
 */
export const useRobustSpeechRecognition = (): RobustSpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [useTextFallback, setUseTextFallback] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedRef = useRef(false);
  
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Clean transcript from duplicated/stretched words
  const cleanTranscript = useCallback((text: string): string => {
    if (!text) return "";
    
    const words = text.split(/\s+/);
    const cleanedWords: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = cleanedWords[cleanedWords.length - 1];
      
      // Skip exact duplicates
      if (prevWord && word.toLowerCase() === prevWord.toLowerCase()) {
        continue;
      }
      
      // Clean stretched characters (myyyy -> my)
      let cleanedWord = word.replace(/(.)\1{2,}/g, "$1$1");
      // Also clean any word with more than 2 consecutive same chars
      cleanedWord = cleanedWord.replace(/(.)\1{1,}/g, "$1");
      
      cleanedWords.push(cleanedWord);
    }
    
    return cleanedWords.join(" ");
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Settings for reliable single sentence capture
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latest = results[results.length - 1];
      
      if (latest) {
        const text = latest[0].transcript.trim();
        const cleanedText = cleanTranscript(text);
        setTranscript(cleanedText);
        
        if (latest.isFinal && cleanedText && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          setHasResult(true);
          setError(null);
          setFailedAttempts(0);
          cleanup();
          
          try {
            recognition.stop();
          } catch (e) {}
        }
      }
    };

    recognition.onspeechstart = () => {
      setError(null);
    };

    recognition.onspeechend = () => {
      cleanup();
      try {
        recognition.stop();
      } catch (e) {}
    };

    recognition.onerror = (event: any) => {
      const errorType = event.error;
      console.error("Speech recognition error:", errorType);
      
      cleanup();
      setIsListening(false);
      
      if (errorType === "no-speech") {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setError("No speech detected. Try again or type your answer.");
        
        if (newAttempts >= 2) {
          setUseTextFallback(true);
          toast.info("Voice not working? Type your answer instead.", { duration: 3000 });
        }
      } else if (errorType === "audio-capture") {
        setError("Microphone not available. Please check permissions.");
        setUseTextFallback(true);
      } else if (errorType === "not-allowed") {
        setError("Microphone access denied. Please enable in browser settings.");
        setUseTextFallback(true);
      } else if (errorType !== "aborted") {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setError("Voice input failed. Try again or type.");
        
        if (newAttempts >= 2) {
          setUseTextFallback(true);
        }
      }
    };

    recognition.onend = () => {
      cleanup();
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      cleanup();
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [isSupported, cleanup, failedAttempts, cleanTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    if (!isSupported) {
      setError("Voice input not supported in your browser");
      setUseTextFallback(true);
      toast.error("Voice not supported. Please type instead.");
      return;
    }
    
    // Reset state
    setTranscript("");
    setHasResult(false);
    setError(null);
    hasProcessedRef.current = false;
    cleanup();
    
    try {
      recognitionRef.current.start();
      
      // Auto-stop after 8 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
          
          if (!hasResult && !hasProcessedRef.current) {
            setError("Listening timed out. Speak clearly or type instead.");
            setFailedAttempts(prev => {
              const newVal = prev + 1;
              if (newVal >= 2) {
                setUseTextFallback(true);
              }
              return newVal;
            });
          }
        }
      }, 8000);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Could not start voice input.");
      setIsListening(false);
      setUseTextFallback(true);
    }
  }, [isListening, cleanup, hasResult, isSupported]);

  const stopListening = useCallback(() => {
    cleanup();
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    
    setIsListening(false);
  }, [isListening, cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setHasResult(false);
    setError(null);
    hasProcessedRef.current = false;
  }, []);

  const retryVoice = useCallback(() => {
    setFailedAttempts(0);
    setUseTextFallback(false);
    setError(null);
    resetTranscript();
  }, [resetTranscript]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    hasResult,
    error,
    failedAttempts,
    retryVoice,
    useTextFallback,
    setUseTextFallback,
  };
};
