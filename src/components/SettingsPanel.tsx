import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, User, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsPanelProps {
  userName: string | null;
  onUserNameChange: (name: string) => void;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  onClearHistory: () => void;
}

const SettingsPanel = ({
  userName,
  onUserNameChange,
  voiceEnabled,
  onVoiceEnabledChange,
  onClearHistory,
}: SettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState(userName || "");

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUserNameChange(nameInput.trim());
    }
  };

  return (
    <>
      {/* Settings button */}
      <motion.button
        className="fixed top-4 right-4 p-3 rounded-full glass text-muted-foreground hover:text-foreground transition-colors z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Settings panel overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border z-50 p-6 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold">Settings</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-8">
                {/* User Name */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Your Name
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    YourBuddy will remember and use your name during conversations.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    />
                    <Button onClick={handleSaveName} disabled={!nameInput.trim()}>
                      Save
                    </Button>
                  </div>
                  {userName && (
                    <p className="text-sm text-muted-foreground">
                      Currently saved: <span className="text-foreground">{userName}</span>
                    </p>
                  )}
                </div>

                {/* Voice Settings */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base">
                    <Volume2 className="w-4 h-4" />
                    Voice Output
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable natural voice responses using ElevenLabs AI voice.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice enabled</span>
                    <Switch
                      checked={voiceEnabled}
                      onCheckedChange={onVoiceEnabledChange}
                    />
                  </div>
                </div>

                {/* Clear History */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base">
                    <Trash2 className="w-4 h-4" />
                    Conversation History
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Clear all conversation history and start fresh.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onClearHistory();
                      setIsOpen(false);
                    }}
                  >
                    Clear History
                  </Button>
                </div>

                {/* About */}
                <div className="pt-8 border-t border-border">
                  <h3 className="font-medium mb-2">About YourBuddy</h3>
                  <p className="text-sm text-muted-foreground">
                    YourBuddy is your AI companion for conversations, learning, and personal growth. 
                    All conversations are private and stored securely.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPanel;
