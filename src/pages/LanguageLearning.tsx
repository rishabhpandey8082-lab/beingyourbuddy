import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Globe, RefreshCw, Trophy, Flame, Target, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import VoiceOrb from "@/components/VoiceOrb";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { toast } from "sonner";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
];

const levels = [
  { id: "beginner", name: "Beginner", description: "Just starting out", xp: 0 },
  { id: "intermediate", name: "Intermediate", description: "Building fluency", xp: 100 },
  { id: "advanced", name: "Advanced", description: "Near native", xp: 500 },
];

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  correction?: string;
}

const LanguageLearning = () => {
  const [language, setLanguage] = useState("de");
  const [level, setLevel] = useState("beginner");
  const [isStarted, setIsStarted] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [streak, setStreak] = useState(3);
  const [sessionXP, setSessionXP] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  const selectedLanguage = languages.find((l) => l.code === language);
  const selectedLevel = levels.find((l) => l.id === level);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [conversation, currentResponse]);

  // Update status
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
    setSessionXP(0);
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

    const greeting = `${greetings[language] || greetings.en}\n\n(Hello! How are you today?)\n\nI'm your ${selectedLanguage?.name} conversation partner! Speak naturally and I'll help you improve. Don't worry about mistakes — that's how we learn! 🌟`;

    setConversation([{ id: crypto.randomUUID(), role: "ai", text: greeting }]);
    speak(greeting);
  };

  const handleUserSpeech = async (userText: string) => {
    setConversation((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: userText }]);
    setSessionXP((prev) => prev + 10);

    try {
      const systemContext = `You are a warm, encouraging ${selectedLanguage?.name} language partner for ${level} level learners.

Your style:
- Be like a supportive friend, not a strict teacher
- Keep responses short (2-3 sentences for ${level} level)
- Always respond in ${selectedLanguage?.name} first, then provide translation in parentheses

For each response:
1. Reply naturally to what they said
2. If there are mistakes, mention them kindly like: "Great effort! A more natural way to say that would be..."
3. Ask a follow-up question to keep the conversation going

Level adjustments (${level}):
${level === "beginner" ? "- Use simple vocabulary\n- Speak slowly\n- Give lots of praise" : ""}
${level === "intermediate" ? "- Mix simple and complex sentences\n- Introduce new vocabulary gently" : ""}
${level === "advanced" ? "- Use natural, fluent speech\n- Include idioms and cultural nuances" : ""}

Make them feel confident and excited to keep speaking!`;

      const response = await sendMessage(userText, "studybuddy", {
        conversationContext: systemContext,
      });

      setConversation((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", text: response }]);
      setSessionXP((prev) => prev + 15);
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
    toast.success(`Session complete! You earned ${sessionXP} XP`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold">Language Partner</h1>
            </div>
          </div>

          {isStarted && (
            <div className="flex items-center gap-4">
              {/* Streak */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/10 text-warning">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{streak}</span>
              </div>
              {/* XP */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">{sessionXP} XP</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-6">
        {!isStarted ? (
          /* Setup Screen - Duolingo inspired */
          <motion.div
            className="w-full max-w-lg flex-1 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Hero */}
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-success via-emerald-400 to-teal-400 flex items-center justify-center shadow-glow"
              >
                <Globe className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">Start Speaking!</h2>
              <p className="text-muted-foreground text-lg">
                Practice real conversations with AI
              </p>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="glass-card rounded-2xl p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>

            {/* Selection */}
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  I want to practice
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-14 rounded-2xl text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-3">
                          <span className="text-xl">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  My current level
                </label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-14 rounded-2xl text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lvl) => (
                      <SelectItem key={lvl.id} value={lvl.id}>
                        <span className="flex flex-col">
                          <span className="font-medium">{lvl.name}</span>
                          <span className="text-xs text-muted-foreground">{lvl.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-success to-emerald-400 hover:from-success/90 hover:to-emerald-400/90 shadow-lg"
                onClick={startSession}
              >
                Start Conversation
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Conversation Screen */
          <motion.div
            className="w-full max-w-2xl flex flex-col flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Language badge & controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedLanguage?.flag}</span>
                <span className="px-3 py-1.5 rounded-xl glass-card text-sm font-medium">
                  {selectedLanguage?.name} • {selectedLevel?.name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={endSession} className="rounded-xl">
                End Session
              </Button>
            </div>

            {/* XP Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Session Progress</span>
                <span className="text-primary font-medium">{sessionXP} XP</span>
              </div>
              <Progress value={Math.min((sessionXP / 100) * 100, 100)} className="h-2" />
            </div>

            {/* Conversation */}
            <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
              <div className="space-y-4 pr-4">
                <AnimatePresence>
                  {conversation.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "glass-card rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Streaming response */}
                {currentResponse && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                      <p className="whitespace-pre-wrap leading-relaxed">{currentResponse}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Voice visualization */}
            <AnimatePresence>
              {status === "listening" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <WaveformVisualizer isActive={true} className="h-12" />
                  {transcript && (
                    <p className="text-sm text-muted-foreground mt-2 text-center italic">"{transcript}"</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Controls */}
            <div className="flex flex-col items-center gap-4 py-4">
              <StatusIndicator status={status} />

              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={repeatLastMessage}
                  disabled={status !== "idle" || conversation.length === 0}
                  title="Repeat last message"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>

                <VoiceOrb
                  status={status}
                  onClick={toggleListening}
                  disabled={!isSupported}
                  size="lg"
                />

                <div className="w-12 h-12" /> {/* Spacer */}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default LanguageLearning;
