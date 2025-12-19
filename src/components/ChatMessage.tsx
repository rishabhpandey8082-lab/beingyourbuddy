import { motion } from "framer-motion";
import { User, Bot, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  onSpeak?: () => void;
  showSpeakButton?: boolean;
}

const ChatMessage = ({ role, content, isTyping, onSpeak, showSpeakButton }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-gradient-to-br from-primary to-emerald-400 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "chat-bubble-user"
            : "chat-bubble-ai"
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-1 py-1">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
            {!isUser && showSpeakButton && onSpeak && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                onClick={onSpeak}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
