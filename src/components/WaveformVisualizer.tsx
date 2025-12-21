import { motion } from "framer-motion";

interface WaveformVisualizerProps {
  isActive: boolean;
  variant?: "bars" | "dots" | "wave";
  color?: "primary" | "destructive" | "muted";
  className?: string;
}

const WaveformVisualizer = ({ isActive, variant = "bars", color = "primary", className = "" }: WaveformVisualizerProps) => {
  const colorClasses = {
    primary: "bg-primary",
    destructive: "bg-destructive",
    muted: "bg-muted-foreground",
  };

  if (variant === "bars") {
    return (
      <div className={`flex items-center justify-center gap-1 h-8 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-1 rounded-full ${colorClasses[color]}`}
            animate={
              isActive
                ? {
                    height: [8, 24, 8],
                  }
                : { height: 8 }
            }
            transition={
              isActive
                ? {
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }
                : { duration: 0.2 }
            }
          />
        ))}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className="flex items-center justify-center gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${colorClasses[color]}`}
            animate={
              isActive
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }
                : { scale: 1, opacity: 0.5 }
            }
            transition={
              isActive
                ? {
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }
                : { duration: 0.2 }
            }
          />
        ))}
      </div>
    );
  }

  // Wave variant
  return (
    <div className="flex items-end justify-center gap-0.5 h-8">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${colorClasses[color]}`}
          style={{ opacity: 0.3 + (i % 3) * 0.2 }}
          animate={
            isActive
              ? {
                  height: [4, 20 + Math.sin(i * 0.8) * 8, 4],
                }
              : { height: 4 }
          }
          transition={
            isActive
              ? {
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
