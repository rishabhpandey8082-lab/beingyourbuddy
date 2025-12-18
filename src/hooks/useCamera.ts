import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  enableCamera: () => Promise<void>;
  disableCamera: () => void;
  toggleCamera: () => Promise<void>;
}

export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsEnabled(true);
      toast.success("Camera enabled");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
        toast.error("Camera permission denied");
      } else if (errorMessage.includes("NotFoundError")) {
        setError("No camera found. Please connect a camera and try again.");
        toast.error("No camera found");
      } else {
        setError(errorMessage);
        toast.error("Failed to enable camera");
      }
      
      console.error("Camera error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsEnabled(false);
    setError(null);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (isEnabled) {
      disableCamera();
    } else {
      await enableCamera();
    }
  }, [isEnabled, enableCamera, disableCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isEnabled,
    isLoading,
    error,
    enableCamera,
    disableCamera,
    toggleCamera,
  };
};
