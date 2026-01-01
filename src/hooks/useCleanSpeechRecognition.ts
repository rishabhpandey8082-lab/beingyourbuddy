import { useState, useCallback, useRef, useEffect } from "react";

interface CleanSpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  hasResult: boolean;
}

/**
 * Clean Speech Recognition Hook
 * 
 * Key features:
 * - NO continuous mode - captures single sentences only
 * - Auto-stops after silence
 * - Processes only FINAL results (no interim stuttering)
 * - Prevents duplicate/stretched character issues
 */
export const useCleanSpeechRecognition = (): CleanSpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasResult, setHasResult] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedRef = useRef(false);
  const maxListenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const cleanup = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (maxListenTimeoutRef.current) {
      clearTimeout(maxListenTimeoutRef.current);
      maxListenTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // CRITICAL: Disable continuous mode for clean single-sentence capture
    recognition.continuous = false;
    recognition.interimResults = false; // Only get final results - no stuttering
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      // Only process if we haven't already processed a result
      if (hasProcessedRef.current) return;
      
      const result = event.results[0];
      if (result && result.isFinal) {
        const finalText = result[0].transcript.trim();
        
        if (finalText) {
          hasProcessedRef.current = true;
          setTranscript(finalText);
          setHasResult(true);
          cleanup();
          
          // Auto-stop after getting a result
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // Already stopped
            }
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      console.error("Speech recognition error:", error);
      
      // Don't treat "no-speech" or "aborted" as fatal errors
      if (error !== "no-speech" && error !== "aborted") {
        cleanup();
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      cleanup();
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    return () => {
      cleanup();
      try {
        recognition.abort();
      } catch (e) {
        // Already stopped
      }
    };
  }, [isSupported, cleanup]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    // Reset state for new listening session
    setTranscript("");
    setHasResult(false);
    hasProcessedRef.current = false;
    cleanup();
    
    try {
      recognitionRef.current.start();
      
      // Maximum listen time of 10 seconds - then auto-stop
      maxListenTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Already stopped
          }
        }
      }, 10000);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  }, [isListening, cleanup]);

  const stopListening = useCallback(() => {
    cleanup();
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Already stopped
      }
    }
  }, [isListening, cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setHasResult(false);
    hasProcessedRef.current = false;
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    hasResult,
  };
};
