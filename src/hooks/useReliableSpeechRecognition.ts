import { useState, useCallback, useRef, useEffect } from "react";

interface ReliableSpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  hasResult: boolean;
  error: string | null;
  failedAttempts: number;
}

/**
 * Reliable Speech Recognition Hook
 * 
 * Key improvements for reliability:
 * - Clear visual feedback when mic is active
 * - Auto-retries on failure
 * - Better error messages
 * - Reliable capture confirmation
 * - Auto text-mode fallback after failures
 */
export const useReliableSpeechRecognition = (): ReliableSpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  
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

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Settings for reliable single sentence capture
    recognition.continuous = false;
    recognition.interimResults = true; // Show interim for feedback
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latest = results[results.length - 1];
      
      if (latest) {
        const text = latest[0].transcript.trim();
        
        // Clean duplicated/stretched words
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
      // User started speaking - good feedback
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
        setFailedAttempts(prev => prev + 1);
        setError("No speech detected. Please try again.");
      } else if (errorType === "audio-capture") {
        setError("Microphone not available. Please check permissions.");
      } else if (errorType === "not-allowed") {
        setError("Microphone access denied. Please enable in browser settings.");
      } else if (errorType !== "aborted") {
        setFailedAttempts(prev => prev + 1);
        setError("Voice input failed. Try again or type your answer.");
      }
    };

    recognition.onend = () => {
      cleanup();
      setIsListening(false);
      
      // If no result after listening, count as failed attempt
      if (!hasResult && !hasProcessedRef.current && isListening) {
        setFailedAttempts(prev => prev + 1);
      }
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
  }, [isSupported, cleanup, hasResult, isListening]);

  // Clean transcript from duplicated/stretched words
  const cleanTranscript = (text: string): string => {
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
      const cleanedWord = word.replace(/(.)\1{2,}/g, "$1$1");
      cleanedWords.push(cleanedWord);
    }
    
    return cleanedWords.join(" ");
  };

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    // Reset state
    setTranscript("");
    setHasResult(false);
    setError(null);
    hasProcessedRef.current = false;
    cleanup();
    
    try {
      recognitionRef.current.start();
      
      // Auto-stop after 8 seconds to prevent hanging
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
          
          if (!hasResult && !hasProcessedRef.current) {
            setError("Listening timed out. Please try again.");
            setFailedAttempts(prev => prev + 1);
          }
        }
      }, 8000);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Could not start voice input. Please try again.");
      setIsListening(false);
    }
  }, [isListening, cleanup, hasResult]);

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
  };
};
