import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";

interface VoiceOrbProps {
  status: "idle" | "listening" | "thinking" | "speaking";
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const VoiceOrb = ({ status, onClick, disabled = false, size = "lg" }: VoiceOrbProps) => {
  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const getStatusStyles = () => {
    switch (status) {
      case "listening":
        return "bg-destructive shadow-[0_0_60px_hsl(0_72%_51%/0.4)]";
      case "thinking":
        return "bg-warning shadow-[0_0_60px_hsl(38_92%_50%/0.4)]";
      case "speaking":
        return "bg-primary shadow-glow";
      default:
        return "bg-gradient-to-br from-primary to-emerald-400 shadow-glow";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "listening":
        return <MicOff className={iconSizes[size]} />;
      case "thinking":
        return <Loader2 className={`${iconSizes[size]} animate-spin`} />;
      case "speaking":
        return <Volume2 className={`${iconSizes[size]} animate-pulse`} />;
      default:
        return <Mic className={iconSizes[size]} />;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rings for listening state */}
      <AnimatePresence>
        {status === "listening" && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`absolute ${sizeClasses[size]} rounded-full border-2 border-destructive/30`}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Outer rings for speaking state */}
      <AnimatePresence>
        {status === "speaking" && (
          <>
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className={`absolute ${sizeClasses[size]} rounded-full border-2 border-primary/20`}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.3 + i * 0.2, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main orb button */}
      <motion.button
        onClick={onClick}
        disabled={disabled || status === "thinking"}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white transition-all duration-300 ${getStatusStyles()} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        whileHover={!disabled && status !== "thinking" ? { scale: 1.05 } : {}}
        whileTap={!disabled && status !== "thinking" ? { scale: 0.95 } : {}}
        animate={status === "speaking" ? { scale: [1, 1.02, 1] } : {}}
        transition={status === "speaking" ? { duration: 0.5, repeat: Infinity } : {}}
      >
        <motion.div
          key={status}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {getIcon()}
        </motion.div>
      </motion.button>

      {/* Status label */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        key={status}
      >
        <span className="text-xs text-muted-foreground">
          {status === "idle" && "Tap to speak"}
          {status === "listening" && "Listening..."}
          {status === "thinking" && "Processing..."}
          {status === "speaking" && "Speaking..."}
        </span>
      </motion.div>
    </div>
  );
};

export default VoiceOrb;
