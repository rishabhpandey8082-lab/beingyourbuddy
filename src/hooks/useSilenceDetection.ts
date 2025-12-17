import { useEffect, useRef, useCallback, useState } from "react";

interface SilenceDetectionOptions {
  silenceThreshold?: number; // ms of silence before triggering
  onSilence?: () => void;
  enabled?: boolean;
}

export const useSilenceDetection = ({
  silenceThreshold = 15000, // 15 seconds default
  onSilence,
  enabled = true,
}: SilenceDetectionOptions = {}) => {
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    setHasPrompted(false);

    if (enabled && onSilence) {
      silenceTimerRef.current = setTimeout(() => {
        if (!hasPrompted) {
          onSilence();
          setHasPrompted(true);
        }
      }, silenceThreshold);
    }
  }, [enabled, onSilence, silenceThreshold, hasPrompted]);

  const stopSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return {
    resetSilenceTimer,
    stopSilenceTimer,
    hasPrompted,
    setHasPrompted,
  };
};
