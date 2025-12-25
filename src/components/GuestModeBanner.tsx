import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Banner component that displays when user is in guest/demo mode.
 * This clearly indicates limited functionality for unauthenticated users.
 */
const GuestModeBanner = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    // Check if user entered via guest mode
    const guestFlag = sessionStorage.getItem("guest_mode");
    setIsGuestMode(guestFlag === "true" && !user);
    
    // Clear guest mode when user signs in
    if (user) {
      sessionStorage.removeItem("guest_mode");
      setIsGuestMode(false);
    }
  }, [user]);

  // Don't show if loading, user is authenticated, or banner dismissed
  if (isLoading || user || dismissed || !isGuestMode) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm text-black px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            Demo Mode: You're exploring as a guest. Features are limited and conversations won't be saved.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs bg-black/20 hover:bg-black/30 text-black border-0"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-black/10 rounded"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestModeBanner;
