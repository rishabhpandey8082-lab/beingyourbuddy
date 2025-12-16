import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Keyboard } from "lucide-react";

interface TextInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const TextInput = ({ onSend, disabled, isExpanded, onToggle }: TextInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle button */}
      <motion.button
        onClick={onToggle}
        className={`p-2.5 rounded-xl transition-colors ${
          isExpanded ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Keyboard className="w-5 h-5" />
      </motion.button>

      {/* Input field */}
      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-2 glass rounded-xl px-4 py-2 min-w-[280px]">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
          />
          <motion.button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default TextInput;
