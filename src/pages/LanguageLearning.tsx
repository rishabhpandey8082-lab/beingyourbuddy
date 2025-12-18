import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Volume2, Globe, Loader2, RefreshCw } from "lucide-react";
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
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
];

const levels = [
  { id: "beginner", name: "Beginner", description: "Basic vocabulary and simple phrases" },
  { id: "intermediate", name: "Intermediate", description: "Conversations and grammar" },
  { id: "advanced", name: "Advanced", description: "Fluent discussions and nuances" },
];

const LanguageLearning = () => {
  const [language, setLanguage] = useState("de");
  const [level, setLevel] = useState("beginner");
  const [isStarted, setIsStarted] = useState(false);
  const [conversation, setConversation] = useState<{ role: "user" | "ai"; text: string; correction?: string }[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  const selectedLanguage = languages.find((l) => l.code === language)?.name || "German";
  const selectedLevel = levels.find((l) => l.id === level);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, currentResponse]);

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

    const greetings: Record<string, string> = {
      en: "Hello! How are you today?",
      es: "¡Hola! ¿Cómo estás hoy?",
      fr: "Bonjour ! Comment allez-vous aujourd'hui ?",
      de: "Hallo! Wie geht es dir heute?",
      it: "Ciao! Come stai oggi?",
      pt: "Olá! Como você está hoje?",
      ja: "こんにちは！今日はお元気ですか？",
      ko: "안녕하세요! 오늘 기분이 어떠세요?",
      zh: "你好！今天过得怎么样？",
      ar: "مرحبا! كيف حالك اليوم؟",
      hi: "नमस्ते! आज आप कैसे हैं?",
      ru: "Привет! Как у тебя дела сегодня?",
    };

    const greeting = `${greetings[language] || greetings.en}

(Hello! How are you today?)

I'm your ${selectedLanguage} conversation partner. Feel free to speak to me in ${selectedLanguage} — I'll gently help you improve as we chat. Don't worry about making mistakes, that's how we learn! 😊`;
    
    setConversation([{ role: "ai", text: greeting }]);
    speak(greeting);
  };

  const handleUserSpeech = async (userText: string) => {
    setConversation((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const systemContext = `You are a warm, patient, and encouraging ${selectedLanguage} language partner for ${level} level learners. 

Your personality:
- You're like a friendly native speaker helping a friend practice
- You're patient and never make the learner feel bad about mistakes
- You keep the conversation natural and flowing
- You're genuinely interested in what they're saying

How to respond:
1. First, respond naturally to what they said (in ${selectedLanguage} with translation in parentheses)
2. If they made any grammar/vocabulary mistakes, mention it casually like: "By the way, you could also say [correct version] - it sounds a bit more natural!"
3. Ask a follow-up question to keep the conversation going
4. Keep your response short and conversational (2-3 sentences max for ${level} level)

For ${level} level:
${level === 'beginner' ? '- Use simple vocabulary and short sentences\n- Speak slowly\n- Give lots of encouragement' : ''}
${level === 'intermediate' ? '- Use moderate vocabulary\n- Mix simple and complex sentences\n- Provide gentle corrections' : ''}
${level === 'advanced' ? '- Use natural, fluent speech\n- Include idioms and expressions\n- Point out subtle nuances' : ''}

Remember: The goal is to make them feel comfortable speaking, like chatting with a supportive friend, not studying in a classroom.`;

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

  const repeatLastMessage = () => {
    const lastAiMessage = [...conversation].reverse().find((m) => m.role === "ai");
    if (lastAiMessage) {
      speak(lastAiMessage.text);
    }
  };

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
        <h1 className="text-xl font-semibold gradient-text">Language Partner</h1>
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
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Conversation Practice</h2>
              <p className="text-muted-foreground">
                Practice speaking like you're chatting with a friend
              </p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  I want to practice
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
                  My current level
                </label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lvl) => (
                      <SelectItem key={lvl.id} value={lvl.id}>
                        <div>
                          <div>{lvl.name}</div>
                          <div className="text-xs text-muted-foreground">{lvl.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full h-12" onClick={startSession}>
                Start Conversation
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
              <span className="px-3 py-1 rounded-full glass text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {selectedLanguage} • {selectedLevel?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={endSession}>
                End Session
              </Button>
            </div>

            {/* Conversation */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 mb-6 max-h-[50vh]"
            >
              <AnimatePresence>
                {conversation.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "glass"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
                  <div className="glass rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="whitespace-pre-wrap leading-relaxed">{currentResponse}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Voice control */}
            <div className="flex flex-col items-center gap-4">
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-6">
                {status === "listening" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    I'm listening...
                  </motion.div>
                )}
                {status === "thinking" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </motion.div>
                )}
                {status === "speaking" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    Speaking...
                  </motion.div>
                )}
                {status === "idle" && "Tap to speak"}
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-4">
                {/* Repeat button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={repeatLastMessage}
                  disabled={status !== "idle" || conversation.length === 0}
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>

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

                {/* Spacer */}
                <div className="w-12 h-12" />
              </div>

              {/* Transcript preview */}
              <AnimatePresence>
                {isListening && transcript && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground italic max-w-md text-center"
                  >
                    "{transcript}"
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default LanguageLearning;
