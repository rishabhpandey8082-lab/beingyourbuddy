import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square } from "lucide-react";

interface MicrophoneButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
  onStopSpeaking: () => void;
}

const MicrophoneButton = ({ isListening, isSpeaking, onToggle, onStopSpeaking }: MicrophoneButtonProps) => {
  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Main mic button */}
      <motion.button
        onClick={isSpeaking ? onStopSpeaking : onToggle}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
          isListening
            ? "bg-primary"
            : isSpeaking
            ? "bg-secondary"
            : "bg-muted hover:bg-muted/80"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: isListening
            ? "0 0 40px hsl(217 91% 60% / 0.4), 0 0 80px hsl(217 91% 60% / 0.2)"
            : isSpeaking
            ? "0 0 40px hsl(263 70% 60% / 0.4), 0 0 80px hsl(263 70% 60% / 0.2)"
            : "0 8px 32px hsl(220 20% 4% / 0.4)",
        }}
      >
        {/* Pulse rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          initial={false}
          animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
        >
          {isSpeaking ? (
            <Square className="w-8 h-8 text-secondary-foreground" />
          ) : isListening ? (
            <Mic className="w-8 h-8 text-primary-foreground" />
          ) : (
            <Mic className="w-8 h-8 text-foreground" />
          )}
        </motion.div>
      </motion.button>

      {/* Label */}
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isSpeaking ? "Tap to stop" : isListening ? "Listening..." : "Tap to talk"}
      </motion.p>

      {/* Audio visualization bars when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute -bottom-12 flex items-end gap-1 h-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary rounded-full"
                animate={{
                  height: [8, 20 + Math.random() * 12, 8],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.3,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MicrophoneButton;
