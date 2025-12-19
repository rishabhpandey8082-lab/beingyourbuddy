import { useState, useCallback, useRef, useEffect } from "react";

interface EnhancedSpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  confidence: number;
}

export const useEnhancedSpeechRecognition = (): EnhancedSpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const accumulatedFinalRef = useRef<string>("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const cleanup = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      lastSpeechTimeRef.current = Date.now();
      
      let interimTranscript = "";
      let currentFinal = "";
      let totalConfidence = 0;
      let confidenceCount = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result[0].confidence) {
          totalConfidence += result[0].confidence;
          confidenceCount++;
        }
        
        if (result.isFinal) {
          currentFinal += text;
        } else {
          interimTranscript += text;
        }
      }

      if (currentFinal) {
        accumulatedFinalRef.current = (accumulatedFinalRef.current + " " + currentFinal).trim();
        setFinalTranscript(accumulatedFinalRef.current);
      }

      if (confidenceCount > 0) {
        setConfidence(totalConfidence / confidenceCount);
      }

      const displayText = (accumulatedFinalRef.current + " " + interimTranscript).trim();
      setTranscript(displayText);

      cleanup();
      
      if (displayText) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (Date.now() - lastSpeechTimeRef.current > 1500) {
            recognition.stop();
          }
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setIsListening(false);
        cleanup();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      cleanup();
    };

    recognition.onstart = () => {
      setIsListening(true);
      lastSpeechTimeRef.current = Date.now();
    };

    recognitionRef.current = recognition;

    return () => {
      cleanup();
      recognition.abort();
    };
  }, [isSupported, cleanup]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setFinalTranscript("");
      accumulatedFinalRef.current = "";
      setConfidence(0);
      lastSpeechTimeRef.current = Date.now();
      
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      cleanup();
      recognitionRef.current.stop();
    }
  }, [isListening, cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
    accumulatedFinalRef.current = "";
    setConfidence(0);
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    confidence,
  };
};
