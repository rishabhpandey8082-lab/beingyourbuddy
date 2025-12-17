import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Avatar3D from "@/components/Avatar3D";
import MicrophoneButton from "@/components/MicrophoneButton";
import ModeSelector, { ConversationMode } from "@/components/ModeSelector";
import Subtitles from "@/components/Subtitles";
import TextInput from "@/components/TextInput";
import SettingsPanel from "@/components/SettingsPanel";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useConversationMemory } from "@/hooks/useConversationMemory";
import { useSilenceDetection } from "@/hooks/useSilenceDetection";
import { toast } from "sonner";

const Index = () => {
  const [mode, setMode] = useState<ConversationMode>("friend");
  const [showTextInput, setShowTextInput] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported: speechRecognitionSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isVoiceLoading } = useElevenLabsTTS();
  const { userName, setUserName, addMessage, getConversationContext, clearMemory, isLoading: isMemoryLoading } = useConversationMemory();

  // Silence detection - gentle prompt after inactivity
  const { resetSilenceTimer, stopSilenceTimer, hasPrompted } = useSilenceDetection({
    silenceThreshold: 20000, // 20 seconds
    enabled: !isLoading && !isSpeaking && !isListening,
    onSilence: () => {
      const silencePrompts = [
        "Take your time, I'm here.",
        "No rush — I'm listening whenever you're ready.",
        "I'm here if you want to talk.",
      ];
      const prompt = silencePrompts[Math.floor(Math.random() * silencePrompts.length)];
      setDisplayText(prompt);
      if (voiceEnabled) {
        speak(prompt);
      }
    },
  });

  // Reset silence timer on user activity
  useEffect(() => {
    if (isListening || isLoading) {
      stopSilenceTimer();
    } else if (!isSpeaking) {
      resetSilenceTimer();
    }
  }, [isListening, isLoading, isSpeaking, resetSilenceTimer, stopSilenceTimer]);

  // Update display text when AI is responding
  useEffect(() => {
    if (currentResponse) {
      setDisplayText(currentResponse);
    }
  }, [currentResponse]);

  // Handle voice input completion
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleSendMessage(transcript.trim());
      resetTranscript();
    }
  }, [isListening]);

  const handleSendMessage = async (message: string) => {
    try {
      setDisplayText("");
      resetSilenceTimer();
      
      // Save user message to memory
      await addMessage({ role: "user", content: message });
      
      const response = await sendMessage(message, mode, {
        userName,
        conversationContext: getConversationContext(),
      });
      
      // Save assistant response to memory
      await addMessage({ role: "assistant", content: response });
      
      // Add natural pause before speaking
      setTimeout(() => {
        if (voiceEnabled) {
          speak(response);
        }
      }, 300);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Something went wrong. Please try again.");
      setDisplayText("");
    }
  };

  const handleMicToggle = useCallback(() => {
    if (!speechRecognitionSupported) {
      toast.error("Speech recognition is not supported in your browser. Try Chrome or Edge.");
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  }, [isListening, startListening, stopListening, stopSpeaking, speechRecognitionSupported]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setDisplayText("");
  }, [stopSpeaking]);

  const handleModeChange = useCallback((newMode: ConversationMode) => {
    setMode(newMode);
    clearHistory();
    setDisplayText("");
    stopSpeaking();
    
    const modeMessages: Record<ConversationMode, string> = {
      friend: "Hey! I'm here to chat. What's on your mind?",
      interviewer: "Let's practice! What position would you like to prepare for?",
      mentor: "I'm here to help you learn and grow. What would you like to explore?",
      studybuddy: "Ready to study together! What subject are we tackling today?",
      therapist: "I'm here to listen. Take your time and share whatever feels right.",
    };
    
    setTimeout(() => {
      let greeting = modeMessages[newMode];
      if (userName) {
        greeting = `Hi ${userName}! ${greeting}`;
      }
      setDisplayText(greeting);
      if (voiceEnabled) {
        speak(greeting);
      }
    }, 500);
  }, [clearHistory, stopSpeaking, speak, voiceEnabled, userName]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    clearMemory();
    setDisplayText("");
    stopSpeaking();
    toast.success("Conversation history cleared");
  }, [clearHistory, clearMemory, stopSpeaking]);

  if (isMemoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading YourBuddy...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-8 px-4 overflow-hidden">
      {/* Settings Panel */}
      <SettingsPanel
        userName={userName}
        onUserNameChange={setUserName}
        voiceEnabled={voiceEnabled}
        onVoiceEnabledChange={setVoiceEnabled}
        onClearHistory={handleClearHistory}
      />

      {/* Header */}
      <motion.header
        className="w-full max-w-4xl flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold gradient-text">YourBuddy</h1>
          {userName && (
            <span className="text-sm text-muted-foreground">
              • Hi, {userName}!
            </span>
          )}
        </div>
        <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
      </motion.header>

      {/* Main content - Avatar */}
      <motion.main
        className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-4xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Avatar3D isSpeaking={isSpeaking} isListening={isListening} />
        
        {/* Subtitles */}
        <div className="min-h-[100px] w-full flex items-center justify-center">
          <Subtitles text={displayText} isVisible={!!displayText || isLoading || isVoiceLoading} />
          {(isLoading || isVoiceLoading) && !displayText && (
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.main>

      {/* Controls */}
      <motion.footer
        className="w-full max-w-4xl flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <TextInput
            onSend={handleSendMessage}
            disabled={isLoading || isSpeaking || isVoiceLoading}
            isExpanded={showTextInput}
            onToggle={() => setShowTextInput(!showTextInput)}
          />
        </div>

        <MicrophoneButton
          isListening={isListening}
          isSpeaking={isSpeaking}
          onToggle={handleMicToggle}
          onStopSpeaking={handleStopSpeaking}
        />

        {/* Trust message */}
        <motion.p
          className="text-sm text-muted-foreground text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          YourBuddy listens without judgment.
        </motion.p>
      </motion.footer>
    </div>
  );
};

export default Index;
