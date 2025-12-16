import { motion } from "framer-motion";
import avatarImage from "@/assets/avatar.png";

interface AvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const Avatar = ({ isSpeaking, isListening }: AvatarProps) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(217 91% 60% / 0.08) 0%, transparent 70%)",
        }}
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : isListening ? [1, 1.05, 1] : 1,
          opacity: isSpeaking ? [0.5, 0.8, 0.5] : isListening ? [0.3, 0.5, 0.3] : 0.3,
        }}
        transition={{
          duration: isSpeaking ? 0.8 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Secondary glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(263 70% 60% / 0.1) 0%, transparent 60%)",
        }}
        animate={{
          scale: isSpeaking ? [1, 1.15, 1] : [1, 1.02, 1],
          opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: isSpeaking ? 0.6 : 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Avatar container */}
      <motion.div
        className="relative z-10"
        animate={{
          y: isSpeaking ? [0, -3, 0] : [0, -5, 0],
          scale: isSpeaking ? [1, 1.02, 1] : [1, 1.01, 1],
        }}
        transition={{
          duration: isSpeaking ? 0.4 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Avatar image */}
        <motion.div
          className="relative w-56 h-56 rounded-full overflow-hidden"
          style={{
            boxShadow: "0 0 60px hsl(217 91% 60% / 0.2), 0 0 120px hsl(263 70% 60% / 0.1)",
          }}
        >
          <img
            src={avatarImage}
            alt="YourBuddy AI Avatar"
            className="w-full h-full object-cover"
          />
          
          {/* Subtle overlay for speaking effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"
            animate={{
              opacity: isSpeaking ? [0.1, 0.3, 0.1] : 0,
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
            }}
          />
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full glass"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className={`w-2 h-2 rounded-full ${
              isListening ? "bg-primary" : isSpeaking ? "bg-secondary" : "bg-muted-foreground"
            }`}
            animate={{
              scale: isListening || isSpeaking ? [1, 1.3, 1] : 1,
              opacity: isListening || isSpeaking ? [0.7, 1, 0.7] : 0.5,
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
            }}
          />
          <span className="text-xs text-muted-foreground">
            {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Avatar;
