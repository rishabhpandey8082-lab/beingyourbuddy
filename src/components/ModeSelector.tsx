import { motion } from "framer-motion";
import { MessageCircle, Briefcase, GraduationCap } from "lucide-react";

export type ConversationMode = "friend" | "interviewer" | "mentor";

interface ModeSelectorProps {
  currentMode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
}

const modes = [
  {
    id: "friend" as const,
    label: "Friend",
    icon: MessageCircle,
    description: "Casual & supportive",
  },
  {
    id: "interviewer" as const,
    label: "Interviewer",
    icon: Briefcase,
    description: "Professional practice",
  },
  {
    id: "mentor" as const,
    label: "Mentor",
    icon: GraduationCap,
    description: "Learn & grow",
  },
];

const ModeSelector = ({ currentMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex gap-2 p-1 rounded-2xl glass">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <motion.button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 bg-primary rounded-xl"
                transition={{ type: "spring", duration: 0.4 }}
                style={{
                  boxShadow: "0 0 20px hsl(217 91% 60% / 0.3)",
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{mode.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
