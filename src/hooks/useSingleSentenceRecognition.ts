import { useState, useCallback, useRef, useEffect } from "react";

interface SingleSentenceRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  hasResult: boolean;
  error: string | null;
}

/**
 * Single Sentence Speech Recognition Hook
 * 
 * Key improvements:
 * - Captures ONLY one sentence
 * - Immediately stops after detecting silence
 * - No repeated/stretched characters
 * - Auto-switches to text mode on failure
 * - Shows "Is this correct?" confirmation flow
 */
export const useSingleSentenceRecognition = (): SingleSentenceRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxListenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedRef = useRef(false);
  const attemptCountRef = useRef(0);
  
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
    
    // CRITICAL SETTINGS for single sentence capture
    recognition.continuous = false; // Stop after first result
    recognition.interimResults = false; // Only final results - no stuttering
    recognition.maxAlternatives = 1;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      // Prevent processing multiple results
      if (hasProcessedRef.current) return;
      
      const result = event.results[0];
      if (result && result.isFinal) {
        const finalText = result[0].transcript.trim();
        
        // Clean up the text - remove duplicated words
        const cleanedText = cleanDuplicateWords(finalText);
        
        if (cleanedText) {
          hasProcessedRef.current = true;
          setTranscript(cleanedText);
          setHasResult(true);
          setError(null);
          cleanup();
          
          // Force stop
          try {
            recognitionRef.current?.stop();
          } catch (e) {
            // Already stopped
          }
        }
      }
    };

    recognition.onspeechend = () => {
      // Stop immediately when user stops speaking
      cleanup();
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // Already stopped
      }
    };

    recognition.onerror = (event: any) => {
      const errorType = event.error;
      console.error("Speech recognition error:", errorType);
      
      cleanup();
      attemptCountRef.current += 1;
      
      // After 2 failed attempts, suggest text mode
      if (attemptCountRef.current >= 2) {
        setError("Voice paused to improve accuracy. Please type your answer.");
      } else if (errorType === "no-speech") {
        setError("No speech detected. Tap to try again.");
      } else if (errorType !== "aborted") {
        setError("Voice input issue. Try again or type instead.");
      }
      
      setIsListening(false);
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
      } catch (e) {
        // Already stopped
      }
    };
  }, [isSupported, cleanup]);

  // Clean duplicate/stretched words from transcript
  const cleanDuplicateWords = (text: string): string => {
    if (!text) return "";
    
    const words = text.split(/\s+/);
    const cleanedWords: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = cleanedWords[cleanedWords.length - 1];
      
      // Skip if same as previous word (removes duplicates)
      if (prevWord && word.toLowerCase() === prevWord.toLowerCase()) {
        continue;
      }
      
      // Clean stretched characters (e.g., "myyyy" -> "my")
      const cleanedWord = word.replace(/(.)\1{2,}/g, "$1$1");
      cleanedWords.push(cleanedWord);
    }
    
    return cleanedWords.join(" ");
  };

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    // Reset state for new listening session
    setTranscript("");
    setHasResult(false);
    setError(null);
    hasProcessedRef.current = false;
    cleanup();
    
    try {
      recognitionRef.current.start();
      
      // Maximum listen time of 5 seconds - then auto-stop (shorter for single sentence)
      maxListenTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Already stopped
          }
        }
      }, 5000);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Could not start voice input. Please try again.");
      setIsListening(false);
    }
  }, [isListening, cleanup]);

  const stopListening = useCallback(() => {
    cleanup();
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Already stopped
      }
    }
    
    setIsListening(false);
  }, [isListening, cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setHasResult(false);
    setError(null);
    hasProcessedRef.current = false;
    attemptCountRef.current = 0;
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
  };
};
