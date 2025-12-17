import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "sonner";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
];

const levels = [
  { id: "beginner", name: "Beginner" },
  { id: "intermediate", name: "Intermediate" },
  { id: "advanced", name: "Advanced" },
];

const LanguageLearning = () => {
  const [language, setLanguage] = useState("de");
  const [level, setLevel] = useState("beginner");
  const [isStarted, setIsStarted] = useState(false);
  const [conversation, setConversation] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  const selectedLanguage = languages.find((l) => l.code === language)?.name || "German";

  // Update status based on states
  useEffect(() => {
    if (isListening) setStatus("listening");
    else if (isLoading) setStatus("thinking");
    else if (isSpeaking || isTTSLoading) setStatus("speaking");
    else setStatus("idle");
  }, [isListening, isLoading, isSpeaking, isTTSLoading]);

  // Handle voice input completion
  useEffect(() => {
    if (!isListening && transcript.trim() && isStarted) {
      handleUserSpeech(transcript.trim());
      resetTranscript();
    }
  }, [isListening, isStarted]);

  const startSession = async () => {
    clearHistory();
    setConversation([]);
    setIsStarted(true);

    const greeting = `Hello! I'm your ${selectedLanguage} language partner. I'm here to help you practice at the ${level} level. Just speak to me in ${selectedLanguage} or English, and I'll help you improve. Let's start! Say something in ${selectedLanguage}.`;
    
    setConversation([{ role: "ai", text: greeting }]);
    speak(greeting);
  };

  const handleUserSpeech = async (userText: string) => {
    setConversation((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const systemContext = `You are a patient, encouraging ${selectedLanguage} language tutor for ${level} level learners. 
        - Always respond in ${selectedLanguage} with an English translation in parentheses
        - Gently correct any grammar or pronunciation hints
        - Keep responses conversational and encouraging
        - Ask follow-up questions to keep the conversation flowing
        - If the user speaks English, encourage them to try in ${selectedLanguage}
        - Be warm and supportive, never critical`;

      const response = await sendMessage(userText, "studybuddy", {
        conversationContext: systemContext,
      });

      setConversation((prev) => [...prev, { role: "ai", text: response }]);
      speak(response);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input not supported in your browser");
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  }, [isListening, isSupported, startListening, stopListening, stopSpeaking]);

  const endSession = () => {
    stopSpeaking();
    stopListening();
    setIsStarted(false);
    setConversation([]);
    clearHistory();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center border-b border-border/50">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-semibold gradient-text">Learn a Language</h1>
        <div className="w-20" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        {!isStarted ? (
          /* Setup screen */
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <Globe className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Voice-Only Practice</h2>
              <p className="text-muted-foreground">
                Speak naturally with your AI language partner
              </p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Select Language
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Your Level
                </label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lvl) => (
                      <SelectItem key={lvl.id} value={lvl.id}>
                        {lvl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full h-12" onClick={startSession}>
                Start Speaking Practice
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Conversation screen */
          <motion.div
            className="w-full max-w-2xl flex flex-col flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Language badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full glass text-sm">
                {selectedLanguage} • {levels.find((l) => l.id === level)?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={endSession}>
                End Session
              </Button>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              <AnimatePresence>
                {conversation.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "glass"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Current response */}
              {currentResponse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="glass rounded-2xl px-4 py-3 max-w-[80%]">
                    <p className="whitespace-pre-wrap">{currentResponse}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Voice control */}
            <div className="flex flex-col items-center gap-4">
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {status === "listening" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening...
                  </>
                )}
                {status === "thinking" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </>
                )}
                {status === "speaking" && (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    Speaking...
                  </>
                )}
                {status === "idle" && "Tap to speak"}
              </div>

              {/* Mic button */}
              <motion.button
                onClick={toggleListening}
                disabled={status === "thinking" || status === "speaking"}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground"
                } ${status === "thinking" || status === "speaking" ? "opacity-50" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </motion.button>

              {/* Transcript preview */}
              {isListening && transcript && (
                <p className="text-sm text-muted-foreground italic">
                  "{transcript}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default LanguageLearning;
