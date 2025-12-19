import { motion } from "framer-motion";
import { Mic, Loader2, Volume2, Circle } from "lucide-react";

interface StatusIndicatorProps {
  status: "idle" | "listening" | "thinking" | "speaking";
  compact?: boolean;
}

const StatusIndicator = ({ status, compact = false }: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "listening":
        return {
          icon: Mic,
          text: "Listening...",
          colorClass: "text-destructive",
          bgClass: "bg-destructive/10 border-destructive/20",
          dotClass: "bg-destructive",
        };
      case "thinking":
        return {
          icon: Loader2,
          text: "Thinking...",
          colorClass: "text-warning",
          bgClass: "bg-warning/10 border-warning/20",
          dotClass: "bg-warning",
          spin: true,
        };
      case "speaking":
        return {
          icon: Volume2,
          text: "Speaking...",
          colorClass: "text-primary",
          bgClass: "bg-primary/10 border-primary/20",
          dotClass: "bg-primary",
          pulse: true,
        };
      default:
        return {
          icon: Circle,
          text: "Ready",
          colorClass: "text-muted-foreground",
          bgClass: "bg-muted/50 border-border",
          dotClass: "bg-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 ${config.colorClass}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass} ${config.pulse ? "animate-pulse" : ""}`} />
        <span className="text-sm">{config.text}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgClass} ${config.colorClass}`}
    >
      <Icon className={`w-4 h-4 ${config.spin ? "animate-spin" : ""} ${config.pulse ? "animate-pulse" : ""}`} />
      <span className="text-sm font-medium">{config.text}</span>
    </motion.div>
  );
};

export default StatusIndicator;
