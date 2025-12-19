import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceActivityDetection {
  isActive: boolean;
  level: number;
}

interface UseVoiceActivityReturn {
  vad: VoiceActivityDetection;
  startVAD: () => Promise<void>;
  stopVAD: () => void;
  isSupported: boolean;
}

export const useVoiceActivity = (): UseVoiceActivityReturn => {
  const [isActive, setIsActive] = useState(false);
  const [level, setLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isSupported = typeof window !== "undefined" && "AudioContext" in window;

  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);

    setLevel(normalizedLevel);
    setIsActive(normalizedLevel > 0.1); // Threshold for voice activity

    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, []);

  const startVAD = useCallback(async () => {
    if (!isSupported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      processAudio();
    } catch (error) {
      console.error("Failed to start voice activity detection:", error);
    }
  }, [isSupported, processAudio]);

  const stopVAD = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsActive(false);
    setLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopVAD();
    };
  }, [stopVAD]);

  return {
    vad: { isActive, level },
    startVAD,
    stopVAD,
    isSupported,
  };
};
