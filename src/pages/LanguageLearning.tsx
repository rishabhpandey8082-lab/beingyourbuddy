import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Globe, RefreshCw, Trophy, Flame, Target, BookOpen, Sparkles, Mic, Volume2, CheckCircle2, XCircle, Star, Zap, Heart, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  { id: "beginner", name: "Beginner", description: "Just starting out", xp: 0, icon: "🌱" },
  { id: "intermediate", name: "Intermediate", description: "Building fluency", xp: 100, icon: "🌿" },
  { id: "advanced", name: "Advanced", description: "Near native", xp: 500, icon: "🌳" },
];

type ActivityType = "fill_blank" | "choose_option" | "translate" | "yes_no" | "type_sentence" | "speaking";

interface Activity {
  type: ActivityType;
  instruction: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  isSpeaking?: boolean;
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  isCorrect?: boolean;
  feedback?: string;
}

const encouragements = [
  "Great job! 🎉",
  "You're doing amazing! ⭐",
  "Keep it up! 💪",
  "Excellent work! 🌟",
  "Perfect! You nailed it! 🏆",
  "Wonderful! 👏",
];

const corrections = [
  "Small mistake, no problem! Let's try again.",
  "Almost there! Here's a hint...",
  "Good effort! The correct answer is...",
  "Don't worry! Learning takes practice.",
];

const LanguageLearning = () => {
  const [language, setLanguage] = useState("de");
  const [level, setLevel] = useState("beginner");
  const [isStarted, setIsStarted] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [streak, setStreak] = useState(3);
  const [sessionXP, setSessionXP] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [activityCount, setActivityCount] = useState(0);
  const [isSpeakingMode, setIsSpeakingMode] = useState(false);
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

  // Handle voice input completion for speaking activities
  useEffect(() => {
    if (!isListening && transcript.trim() && isStarted && isSpeakingMode) {
      handleSpeakingAnswer(transcript.trim());
      resetTranscript();
    }
  }, [isListening, isStarted, isSpeakingMode]);

  const startSession = async () => {
    clearHistory();
    setConversation([]);
    setSessionXP(0);
    setHearts(5);
    setLessonProgress(0);
    setActivityCount(0);
    setIsStarted(true);
    setIsSpeakingMode(false);

    const greeting = `🎉 Welcome to your ${selectedLanguage?.name} lesson!\n\nI'm your Duolingo-style language coach. We'll learn step-by-step with fun activities!\n\nLet's start with something simple. Ready? 💪`;

    setConversation([{ id: crypto.randomUUID(), role: "ai", text: greeting }]);
    speak(greeting);
    
    // Generate first activity after greeting
    setTimeout(() => generateNextActivity(), 2000);
  };

  const generateNextActivity = async () => {
    setShowFeedback(false);
    setUserAnswer("");
    setCurrentActivity(null);
    
    const activityTypes: ActivityType[] = ["fill_blank", "choose_option", "translate", "yes_no", "type_sentence", "speaking"];
    const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    // Activate speaking mode more frequently
    const shouldSpeak = randomType === "speaking" || (activityCount > 0 && activityCount % 3 === 0);
    setIsSpeakingMode(shouldSpeak);

    const systemPrompt = `You are a Duolingo-style ${selectedLanguage?.name} language tutor for ${level} level.

Generate ONE simple activity. Return ONLY valid JSON in this exact format:
{
  "type": "${randomType}",
  "instruction": "Brief instruction in English",
  "content": "The question or prompt",
  "options": ["option1", "option2", "option3"] (only for choose_option or fill_blank),
  "correctAnswer": "The correct answer"
}

Rules:
- Keep it SHORT and simple for ${level} level
- Use common vocabulary
- For fill_blank: Use ___ for the blank
- For speaking: Ask user to repeat a simple phrase
- For translate: Give a simple sentence to translate
- For yes_no: Ask if a sentence is correct
- Make it fun and engaging

Language: ${selectedLanguage?.name}`;

    try {
      const response = await sendMessage(`Generate a ${randomType} activity for ${selectedLanguage?.name} ${level} level`, "studybuddy", {
        conversationContext: systemPrompt,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const activity = JSON.parse(jsonMatch[0]) as Activity;
        activity.isSpeaking = shouldSpeak;
        setCurrentActivity(activity);
        
        const activityMessage = formatActivityMessage(activity, shouldSpeak);
        setConversation(prev => [...prev, { id: crypto.randomUUID(), role: "ai", text: activityMessage }]);
        speak(activity.instruction + ". " + activity.content);
      }
    } catch (error) {
      console.error("Activity generation error:", error);
      // Fallback activity
      const fallback: Activity = {
        type: "translate",
        instruction: "Translate this sentence",
        content: selectedLanguage?.code === "de" ? "Guten Tag" : "Hello",
        correctAnswer: selectedLanguage?.code === "de" ? "Good day" : "Hola",
        isSpeaking: shouldSpeak
      };
      setCurrentActivity(fallback);
      setConversation(prev => [...prev, { id: crypto.randomUUID(), role: "ai", text: formatActivityMessage(fallback, shouldSpeak) }]);
    }
  };

  const formatActivityMessage = (activity: Activity, isSpeaking: boolean): string => {
    let message = "";
    
    const activityIcons: Record<ActivityType, string> = {
      fill_blank: "✏️",
      choose_option: "🔘",
      translate: "🔄",
      yes_no: "❓",
      type_sentence: "⌨️",
      speaking: "🎤"
    };

    message += `${activityIcons[activity.type]} **${activity.instruction}**\n\n`;
    message += `${activity.content}\n\n`;
    
    if (activity.options && activity.options.length > 0) {
      message += activity.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n");
      message += "\n\n";
    }

    if (isSpeaking) {
      message += "🎤 **Please speak your answer!**";
    } else if (activity.type === "type_sentence") {
      message += "⌨️ Type your answer below";
    }

    return message;
  };

  const checkAnswer = async (answer: string) => {
    if (!currentActivity) return;

    setShowFeedback(true);
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = currentActivity.correctAnswer?.toLowerCase().trim() || "";
    
    // Flexible matching
    const isCorrect = normalizedAnswer === normalizedCorrect || 
                      normalizedCorrect.includes(normalizedAnswer) ||
                      normalizedAnswer.includes(normalizedCorrect) ||
                      (currentActivity.options && 
                       currentActivity.options.some(opt => 
                         opt.toLowerCase().includes(normalizedAnswer) && 
                         opt.toLowerCase() === normalizedCorrect));

    setIsCorrectAnswer(isCorrect);
    
    if (isCorrect) {
      const xpGain = isSpeakingMode ? 20 : 15;
      setSessionXP(prev => prev + xpGain);
      setLessonProgress(prev => Math.min(prev + 15, 100));
      setActivityCount(prev => prev + 1);
      
      const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      const feedbackMsg = `${encouragement}\n\n+${xpGain} XP 🌟`;
      
      setConversation(prev => [...prev, 
        { id: crypto.randomUUID(), role: "user", text: answer },
        { id: crypto.randomUUID(), role: "ai", text: feedbackMsg, isCorrect: true }
      ]);
      speak(encouragement);
    } else {
      setHearts(prev => Math.max(prev - 1, 0));
      const correction = corrections[Math.floor(Math.random() * corrections.length)];
      const feedbackMsg = `${correction}\n\nThe correct answer was: **${currentActivity.correctAnswer}**`;
      
      setConversation(prev => [...prev, 
        { id: crypto.randomUUID(), role: "user", text: answer },
        { id: crypto.randomUUID(), role: "ai", text: feedbackMsg, isCorrect: false }
      ]);
      speak(correction);
    }

    // Continue to next activity after delay
    setTimeout(() => {
      if (lessonProgress >= 100 || activityCount >= 6) {
        endSession();
      } else {
        generateNextActivity();
      }
    }, 2500);
  };

  const handleSpeakingAnswer = (spokenText: string) => {
    setUserAnswer(spokenText);
    checkAnswer(spokenText);
    setIsSpeakingMode(false);
  };

  const handleTextSubmit = () => {
    if (userAnswer.trim()) {
      checkAnswer(userAnswer.trim());
    }
  };

  const handleOptionSelect = (option: string) => {
    setUserAnswer(option);
    checkAnswer(option);
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
    setCurrentActivity(null);
    setIsSpeakingMode(false);
    
    const finalMessage = `🎉 Lesson Complete!\n\nYou earned ${sessionXP} XP today!\n\nKeep up your ${streak} day streak! 🔥`;
    setConversation(prev => [...prev, { id: crypto.randomUUID(), role: "ai", text: finalMessage }]);
    toast.success(`Session complete! You earned ${sessionXP} XP`);
    
    setTimeout(() => {
      setConversation([]);
      clearHistory();
    }, 3000);
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
              <h1 className="text-lg font-semibold">Language Coach</h1>
            </div>
          </div>

          {isStarted && (
            <div className="flex items-center gap-3">
              {/* Hearts */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/10">
                <Heart className="h-4 w-4 text-destructive fill-destructive" />
                <span className="text-sm font-medium text-destructive">{hearts}</span>
              </div>
              {/* Streak */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-warning/10 text-warning">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{streak}</span>
              </div>
              {/* XP */}
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{sessionXP}</span>
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
                className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-success via-emerald-400 to-teal-400 flex items-center justify-center shadow-glow"
              >
                <Globe className="w-14 h-14 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">Learn a Language!</h2>
              <p className="text-muted-foreground text-lg">
                Duolingo-style lessons with a speaking tutor
              </p>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform"
              >
                <Flame className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform"
              >
                <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform"
              >
                <Target className="h-6 w-6 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </motion.div>
            </div>

            {/* Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-3xl p-6 space-y-6"
            >
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  I want to learn
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
                <div className="grid grid-cols-3 gap-2">
                  {levels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setLevel(lvl.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        level === lvl.id
                          ? "border-success bg-success/10"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{lvl.icon}</span>
                      <span className="text-sm font-medium block">{lvl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-success to-emerald-400 hover:from-success/90 hover:to-emerald-400/90 shadow-lg"
                onClick={startSession}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Lesson
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          /* Lesson Screen */
          <motion.div
            className="w-full max-w-2xl flex flex-col flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedLanguage?.flag}</span>
                  <span className="font-medium">{selectedLanguage?.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={endSession} className="rounded-xl">
                  End Lesson
                </Button>
              </div>
              <div className="relative">
                <Progress value={lessonProgress} className="h-3" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: lessonProgress >= 100 ? [1, 1.2, 1] : 1 }}
                >
                  {lessonProgress >= 100 && <Award className="w-6 h-6 text-warning" />}
                </motion.div>
              </div>
            </div>

            {/* Conversation & Activities */}
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
                            ? msg.isCorrect === false
                              ? "bg-destructive/20 text-foreground rounded-br-md"
                              : msg.isCorrect === true
                              ? "bg-success/20 text-foreground rounded-br-md"
                              : "bg-primary text-primary-foreground rounded-br-md"
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

            {/* Activity Input Area */}
            {currentActivity && !showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-2xl glass-card"
              >
                {/* Multiple choice options */}
                {currentActivity.options && currentActivity.options.length > 0 && !isSpeakingMode && (
                  <div className="grid grid-cols-2 gap-2">
                    {currentActivity.options.map((option, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="h-12 rounded-xl text-left justify-start hover:bg-primary/10 hover:border-primary"
                        onClick={() => handleOptionSelect(option)}
                      >
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2 text-sm">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {option}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Text input for type activities */}
                {!currentActivity.options && !isSpeakingMode && (
                  <div className="flex gap-2">
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="flex-1 h-12 rounded-xl"
                      onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                    />
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!userAnswer.trim()}
                      className="h-12 px-6 rounded-xl bg-success hover:bg-success/90"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Speaking mode prompt */}
                {isSpeakingMode && (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-primary mb-2">
                      <Mic className="w-5 h-5 animate-pulse" />
                      <span className="font-medium">Speak your answer</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tap the microphone and say your answer
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Feedback display */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`mb-4 p-4 rounded-2xl flex items-center gap-3 ${
                    isCorrectAnswer 
                      ? "bg-success/20 border border-success/30" 
                      : "bg-destructive/20 border border-destructive/30"
                  }`}
                >
                  {isCorrectAnswer ? (
                    <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold ${isCorrectAnswer ? "text-success" : "text-destructive"}`}>
                      {isCorrectAnswer ? "Correct!" : "Not quite..."}
                    </p>
                    {!isCorrectAnswer && currentActivity?.correctAnswer && (
                      <p className="text-sm text-muted-foreground">
                        Answer: {currentActivity.correctAnswer}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <Volume2 className="w-5 h-5" />
                </Button>

                <VoiceOrb
                  status={status}
                  onClick={toggleListening}
                  disabled={!isSupported}
                  size="lg"
                />

                <Button
                  variant="outline"
                  size="icon"
                  className={`w-12 h-12 rounded-full ${isSpeakingMode ? "bg-primary/20 border-primary" : ""}`}
                  onClick={() => setIsSpeakingMode(!isSpeakingMode)}
                  title="Speaking mode"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default LanguageLearning;
