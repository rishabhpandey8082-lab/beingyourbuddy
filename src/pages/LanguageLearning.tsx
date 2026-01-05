import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Globe, RefreshCw, Trophy, Flame, Target, BookOpen, Sparkles, 
  Mic, Volume2, CheckCircle2, XCircle, Star, Zap, Heart, Award, 
  GraduationCap, MessageCircle, FileText, Pause, Play, RotateCcw, Check, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/useChat";
import { useReliableSpeechRecognition } from "@/hooks/useReliableSpeechRecognition";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import VoiceOrb from "@/components/VoiceOrb";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import VisualLearningActivity from "@/components/VisualLearningActivity";
import { toast } from "sonner";

// Learning Mode Types
type LearningMode = "ielts" | "german" | "general";
type IELTSSkill = "speaking" | "writing" | "reading" | "listening";
type GermanLevel = "A1" | "A2" | "B1" | "B2" | "C1";
type ActivityType = "fill_blank" | "choose_option" | "translate" | "yes_no" | "type_sentence" | "speaking";

// Supported Languages
type TargetLanguage = "english" | "german" | "french" | "spanish" | "italian" | "japanese" | "korean" | "hindi" | "portuguese" | "chinese";

interface Activity {
  type: ActivityType;
  instruction: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  isSpeaking?: boolean;
  feedbackType?: "ielts" | "german" | "general";
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  isCorrect?: boolean;
  feedback?: string;
}

interface IELTSFeedback {
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  suggestion: string;
}

const learningModes = [
  { id: "ielts" as const, label: "IELTS Preparation", icon: GraduationCap, description: "Speaking, Writing, Reading, Listening", color: "from-blue-500 to-indigo-500", path: "/ielts" },
  { id: "german" as const, label: "German Goethe Exam", icon: Globe, description: "A1 to C1 Level Preparation", color: "from-amber-500 to-orange-500", path: "/goethe" },
  { id: "general" as const, label: "General Language Practice", icon: MessageCircle, description: "Daily practice & confidence in any language", color: "from-emerald-500 to-teal-500", path: null },
];

const targetLanguages: { id: TargetLanguage; name: string; flag: string }[] = [
  { id: "english", name: "English", flag: "🇬🇧" },
  { id: "german", name: "German", flag: "🇩🇪" },
  { id: "french", name: "French", flag: "🇫🇷" },
  { id: "spanish", name: "Spanish", flag: "🇪🇸" },
  { id: "italian", name: "Italian", flag: "🇮🇹" },
  { id: "japanese", name: "Japanese", flag: "🇯🇵" },
  { id: "korean", name: "Korean", flag: "🇰🇷" },
  { id: "hindi", name: "Hindi", flag: "🇮🇳" },
  { id: "portuguese", name: "Portuguese", flag: "🇧🇷" },
  { id: "chinese", name: "Chinese", flag: "🇨🇳" },
];

const germanLevels: { id: GermanLevel; name: string; description: string }[] = [
  { id: "A1", name: "A1 - Beginner", description: "Basic phrases & greetings" },
  { id: "A2", name: "A2 - Elementary", description: "Simple conversations" },
  { id: "B1", name: "B1 - Intermediate", description: "Independent speaker" },
  { id: "B2", name: "B2 - Upper Intermediate", description: "Complex discussions" },
  { id: "C1", name: "C1 - Advanced", description: "Near-native fluency" },
];

const ieltsSkills: { id: IELTSSkill; name: string; icon: any }[] = [
  { id: "speaking", name: "Speaking", icon: Mic },
  { id: "writing", name: "Writing", icon: FileText },
  { id: "reading", name: "Reading", icon: BookOpen },
  { id: "listening", name: "Listening", icon: Volume2 },
];

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
  const navigate = useNavigate();
  // Mode & Setup State
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("english");
  const [germanLevel, setGermanLevel] = useState<GermanLevel>("A1");
  const [ieltsSkill, setIeltsSkill] = useState<IELTSSkill>("speaking");
  const [ieltsPart, setIeltsPart] = useState(1);
  
  // Session State
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
  const [talkOnlyMode, setTalkOnlyMode] = useState(false);
  const [slowMode, setSlowMode] = useState(false);
  const [showVisualActivity, setShowVisualActivity] = useState(false);
  const [visualActivityMode, setVisualActivityMode] = useState(false);
  
  // Voice Control State - Using confirmation flow
  const [pendingVoiceConfirm, setPendingVoiceConfirm] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, hasResult, error: speechError, failedAttempts } = useReliableSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useNaturalTTS();

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

  // Handle voice input completion - show confirmation
  useEffect(() => {
    if (!isListening && hasResult && transcript.trim() && isStarted) {
      setPendingVoiceConfirm(transcript.trim());
    }
  }, [isListening, hasResult, transcript, isStarted]);

  const confirmVoiceInput = () => {
    if (pendingVoiceConfirm) {
      handleVoiceAnswer(pendingVoiceConfirm);
      setPendingVoiceConfirm(null);
      resetTranscript();
    }
  };

  const retryVoiceInput = () => {
    setPendingVoiceConfirm(null);
    resetTranscript();
    startListening();
  };

  const getModeSystemPrompt = (): string => {
    const langName = targetLanguages.find(l => l.id === targetLanguage)?.name || "English";
    
    if (selectedMode === "ielts") {
      if (ieltsSkill === "speaking") {
        return `You are an IELTS Speaking examiner. Follow the official IELTS format strictly.

Current Part: ${ieltsPart}
${ieltsPart === 1 ? "Part 1: Ask simple questions about familiar topics (work, study, hobbies, family). 4-5 minutes." : ""}
${ieltsPart === 2 ? "Part 2: Give a cue card topic. User must speak for 1-2 minutes." : ""}
${ieltsPart === 3 ? "Part 3: Ask deeper discussion questions related to Part 2 topic." : ""}

After each response, provide brief feedback on:
- Fluency & Coherence
- Vocabulary
- Grammar
- Pronunciation
Then suggest how to improve band score.`;
      } else if (ieltsSkill === "writing") {
        return `You are an IELTS Writing examiner. Help with Task 1 (graphs/charts) or Task 2 (essays).
Teach structure: Introduction → Body → Conclusion.
Correct mistakes gently and show higher band sample answers.`;
      }
      return `You are an IELTS ${ieltsSkill} tutor. Follow official IELTS format. Difficulty matches band 5.0-7.5+.`;
    }
    
    if (selectedMode === "german") {
      return `You are a German Goethe Exam tutor for ${germanLevel} level.

Skills: Sprechen, Hören, Lesen, Schreiben
- Start with simple German appropriate for ${germanLevel}
- English explanations allowed when needed
- Focus on: pronunciation, sentence structure, daily scenarios
- Role-play scenarios: office, doctor, travel, shopping

Always respond in German first, then provide English help if needed.
Encourage the user warmly after every attempt.`;
    }
    
    return `You are a Duolingo-style ${langName} tutor. Focus on:
- Daily conversation in ${langName}
- Vocabulary building
- Grammar practice
- Speaking confidence

Keep lessons SHORT and FUN. One concept at a time.
Use activities: fill blanks, choose option, translate, speak.`;
  };

  const startSession = async () => {
    if (!selectedMode) {
      toast.error("Please select a learning mode first");
      return;
    }

    clearHistory();
    setConversation([]);
    setSessionXP(0);
    setHearts(5);
    setLessonProgress(0);
    setActivityCount(0);
    setIsStarted(true);
    setIsSpeakingMode(false);
    setIeltsPart(1);
    setPendingVoiceConfirm(null);

    const langName = targetLanguages.find(l => l.id === targetLanguage)?.name || "English";
    let greeting = "";
    
    if (selectedMode === "ielts") {
      greeting = `🎓 Welcome to IELTS ${ieltsSkill.charAt(0).toUpperCase() + ieltsSkill.slice(1)} Practice!\n\nI'll help you prepare exactly like the real exam. Let's start with Part 1.\n\nReady? 💪`;
    } else if (selectedMode === "german") {
      greeting = `🇩🇪 Willkommen! Welcome to German ${germanLevel} Practice!\n\nI'm your Goethe exam coach. We'll practice Sprechen, Hören, Lesen, and Schreiben.\n\nLass uns anfangen! (Let's begin!) 🎯`;
    } else {
      greeting = `🎉 Welcome to your ${langName} Practice Session!\n\nI'm your Duolingo-style coach. We'll learn step-by-step with fun activities!\n\nReady to start? 💪`;
    }

    setConversation([{ id: crypto.randomUUID(), role: "ai", text: greeting }]);
    
    if (!slowMode) {
      speak(greeting, targetLanguage);
    }
    
    setTimeout(() => generateNextActivity(), 2000);
  };

  const generateNextActivity = async () => {
    setShowFeedback(false);
    setUserAnswer("");
    setCurrentActivity(null);
    
    // If visual mode is enabled, show visual activity every 2nd activity
    if (visualActivityMode && activityCount % 2 === 1) {
      setShowVisualActivity(true);
      return;
    }
    
    setShowVisualActivity(false);
    
    const activityTypes: ActivityType[] = selectedMode === "ielts" && ieltsSkill === "speaking" 
      ? ["speaking"] 
      : ["fill_blank", "choose_option", "translate", "yes_no", "type_sentence", "speaking"];
    
    const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const shouldSpeak = randomType === "speaking" || talkOnlyMode || (activityCount > 0 && activityCount % 3 === 0);
    setIsSpeakingMode(shouldSpeak);

    const systemPrompt = getModeSystemPrompt();

    try {
      let activityPrompt = "";
      
      if (selectedMode === "ielts" && ieltsSkill === "speaking") {
        activityPrompt = `Generate an IELTS Speaking Part ${ieltsPart} question. Return JSON:
{
  "type": "speaking",
  "instruction": "${ieltsPart === 2 ? "Here's your cue card. Speak for 1-2 minutes." : "Please answer this question."}",
  "content": "The question or cue card topic",
  "correctAnswer": "A model answer for band 7+"
}`;
      } else if (selectedMode === "german") {
        activityPrompt = `Generate a German ${germanLevel} activity. Return JSON:
{
  "type": "${randomType}",
  "instruction": "Brief instruction",
  "content": "German question or prompt",
  "options": ["option1", "option2", "option3"] (if applicable),
  "correctAnswer": "The correct answer"
}`;
      } else {
        activityPrompt = `Generate a ${randomType} activity. Return JSON:
{
  "type": "${randomType}",
  "instruction": "Brief instruction",
  "content": "The question",
  "options": ["option1", "option2", "option3"] (if applicable),
  "correctAnswer": "The correct answer"
}`;
      }

      const response = await sendMessage(activityPrompt, "studybuddy", {
        conversationContext: systemPrompt,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const activity = JSON.parse(jsonMatch[0]) as Activity;
        activity.isSpeaking = shouldSpeak;
        activity.feedbackType = selectedMode || "general";
        setCurrentActivity(activity);
        
        const activityMessage = formatActivityMessage(activity, shouldSpeak);
        setConversation(prev => [...prev, { id: crypto.randomUUID(), role: "ai", text: activityMessage }]);
        
        if (!slowMode) {
          speak(activity.instruction + ". " + activity.content, targetLanguage);
        }
      }
    } catch (error) {
      console.error("Activity generation error:", error);
      const fallback: Activity = {
        type: "translate",
        instruction: "Translate this sentence",
        content: selectedMode === "german" ? "Guten Tag" : "Hello, how are you?",
        correctAnswer: selectedMode === "german" ? "Good day" : "Hola, ¿cómo estás?",
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
      message += "🎤 **Tap speak and say ONE sentence.**\n_(I'll listen for 2-3 seconds)_";
    } else if (activity.type === "type_sentence") {
      message += "⌨️ Type your answer below";
    }

    return message;
  };

  const getIELTSFeedback = async (answer: string): Promise<string> => {
    const feedbackPrompt = `Rate this IELTS Speaking response and provide feedback:

User's answer: "${answer}"

Provide JSON feedback:
{
  "fluency": 6,
  "vocabulary": 5,
  "grammar": 6,
  "pronunciation": 7,
  "overallBand": 6,
  "suggestion": "Specific improvement tip"
}`;

    try {
      const response = await sendMessage(feedbackPrompt, "studybuddy", {
        conversationContext: getModeSystemPrompt(),
      });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const feedback = JSON.parse(jsonMatch[0]);
        return `📊 **IELTS Feedback:**\n\n` +
          `• Fluency: ${feedback.fluency}/9\n` +
          `• Vocabulary: ${feedback.vocabulary}/9\n` +
          `• Grammar: ${feedback.grammar}/9\n` +
          `• Pronunciation: ${feedback.pronunciation}/9\n\n` +
          `**Estimated Band: ${feedback.overallBand}**\n\n` +
          `💡 ${feedback.suggestion}`;
      }
    } catch (e) {
      console.error("Feedback error:", e);
    }
    
    return "Good attempt! Keep practicing to improve your band score.";
  };

  const checkAnswer = async (answer: string) => {
    if (!currentActivity) return;

    setShowFeedback(true);
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = currentActivity.correctAnswer?.toLowerCase().trim() || "";
    
    // For IELTS speaking, we provide detailed feedback instead of right/wrong
    if (selectedMode === "ielts" && ieltsSkill === "speaking") {
      const feedback = await getIELTSFeedback(answer);
      setIsCorrectAnswer(true);
      const xpGain = 20;
      setSessionXP(prev => prev + xpGain);
      setLessonProgress(prev => Math.min(prev + 20, 100));
      setActivityCount(prev => prev + 1);
      
      setConversation(prev => [...prev, 
        { id: crypto.randomUUID(), role: "user", text: answer },
        { id: crypto.randomUUID(), role: "ai", text: feedback + `\n\n+${xpGain} XP 🌟`, isCorrect: true }
      ]);
      
      if (!slowMode) {
        speak("Good effort! Here's your feedback.");
      }
      
      // Progress to next part after several questions
      if (activityCount > 0 && activityCount % 3 === 0 && ieltsPart < 3) {
        setIeltsPart(prev => prev + 1);
      }
    } else {
      // Standard correct/incorrect checking
      const isCorrect = normalizedAnswer === normalizedCorrect || 
                        normalizedCorrect.includes(normalizedAnswer) ||
                        normalizedAnswer.includes(normalizedCorrect) ||
                        (currentActivity.options && 
                         currentActivity.options.some(opt => 
                           opt.toLowerCase().includes(normalizedAnswer) && 
                           opt.toLowerCase() === normalizedCorrect));

      setIsCorrectAnswer(isCorrect);
      
      if (isCorrect) {
        const xpGain = isSpeakingMode ? 15 : 10;
        setSessionXP(prev => prev + xpGain);
        setLessonProgress(prev => Math.min(prev + 15, 100));
        setActivityCount(prev => prev + 1);
        
        const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        const feedbackMsg = `${encouragement}\n\n+${xpGain} XP 🌟`;
        
        setConversation(prev => [...prev, 
          { id: crypto.randomUUID(), role: "user", text: answer },
          { id: crypto.randomUUID(), role: "ai", text: feedbackMsg, isCorrect: true }
        ]);
        
        if (!slowMode) {
          speak(encouragement, targetLanguage);
        }
      } else {
        setHearts(prev => Math.max(prev - 1, 0));
        const correction = corrections[Math.floor(Math.random() * corrections.length)];
        const feedbackMsg = `${correction}\n\nThe correct answer was: **${currentActivity.correctAnswer}**`;
        
        setConversation(prev => [...prev, 
          { id: crypto.randomUUID(), role: "user", text: answer },
          { id: crypto.randomUUID(), role: "ai", text: feedbackMsg, isCorrect: false }
        ]);
        
        if (!slowMode) {
          speak(correction, targetLanguage);
        }
      }
    }

    // Continue to next activity after delay
    setTimeout(() => {
      if (lessonProgress >= 100 || activityCount >= 8) {
        endSession();
      } else if (hearts === 0) {
        // Slow revision mode when out of hearts
        toast.info("Switching to slow revision mode");
        setSlowMode(true);
        generateNextActivity();
      } else {
        generateNextActivity();
      }
    }, 2500);
  };

  const handleVoiceAnswer = (spokenText: string) => {
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
      setIsSpeakingMode(false);
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      setPendingVoiceConfirm(null);
      resetTranscript();
      startListening();
      // Auto-stop after 5 seconds max
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 5000);
    }
  }, [isListening, isSupported, startListening, stopListening, stopSpeaking]);

  const repeatLastMessage = () => {
    const lastAiMessage = [...conversation].reverse().find((m) => m.role === "ai");
    if (lastAiMessage) {
      speak(lastAiMessage.text, targetLanguage);
    }
  };

  const endSession = () => {
    stopSpeaking();
    stopListening();
    setIsStarted(false);
    setCurrentActivity(null);
    setIsSpeakingMode(false);
    
    const finalMessage = `🎉 Lesson Complete!\n\nYou earned ${sessionXP} XP today!\n\n🔥 ${streak} day streak! Keep going!`;
    setConversation(prev => [...prev, { id: crypto.randomUUID(), role: "ai", text: finalMessage }]);
    toast.success(`Session complete! You earned ${sessionXP} XP`);
    
    setTimeout(() => {
      setConversation([]);
      clearHistory();
      setSelectedMode(null);
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
              <h1 className="text-lg font-semibold">
                {selectedMode === "ielts" ? "IELTS Coach" : 
                 selectedMode === "german" ? "German Coach" : 
                 selectedMode === "general" ? "English Coach" : "Language Coach"}
              </h1>
            </div>
          </div>

          {isStarted && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/10">
                <Heart className="h-4 w-4 text-destructive fill-destructive" />
                <span className="text-sm font-medium text-destructive">{hearts}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-warning/10 text-warning">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{streak}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{sessionXP}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-6">
        {!selectedMode ? (
          /* Language Selection Screen First */
          <motion.div
            className="w-full max-w-4xl flex-1 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-success via-emerald-400 to-teal-400 flex items-center justify-center shadow-glow"
              >
                <Globe className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">Choose Your Language</h2>
              <p className="text-muted-foreground text-lg">
                Select a language to start learning
              </p>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {targetLanguages.map((lang, index) => (
                <motion.button
                  key={lang.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setTargetLanguage(lang.id)}
                  className={`p-4 rounded-2xl glass-card hover:scale-105 transition-all text-center group ${
                    targetLanguage === lang.id ? "ring-2 ring-primary bg-primary/10" : ""
                  }`}
                >
                  <span className="text-4xl block mb-2">{lang.flag}</span>
                  <span className="font-medium text-sm">{lang.name}</span>
                  {targetLanguage === lang.id && (
                    <motion.div
                      layoutId="selected-lang"
                      className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Mode Selection */}
            <h3 className="text-xl font-semibold mb-4 text-center">Choose Your Path</h3>
            <div className="space-y-4">
              {learningModes.map((mode, index) => {
                const Icon = mode.icon;
                const handleClick = () => {
                  if (mode.path) {
                    navigate(mode.path);
                  } else {
                    setSelectedMode(mode.id);
                  }
                };
                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={handleClick}
                    className="w-full p-6 rounded-2xl glass-card hover:scale-[1.02] transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{mode.label}</h3>
                        <p className="text-muted-foreground">{mode.description}</p>
                        {mode.path && (
                          <span className="text-xs text-primary mt-1 block">Opens dedicated practice page →</span>
                        )}
                      </div>
                      <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : !isStarted ? (
          /* Setup Screen */
          <motion.div
            className="w-full max-w-lg flex-1 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              className="self-start mb-4"
              onClick={() => setSelectedMode(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to modes
            </Button>

            <div className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2">
                {selectedMode === "ielts" ? "IELTS Preparation" :
                 selectedMode === "german" ? "German Goethe Exam" :
                 "General English Practice"}
              </h2>
              <p className="text-muted-foreground">Configure your session</p>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass-card rounded-2xl p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Heart className="h-6 w-6 mx-auto mb-2 text-destructive" />
                <p className="text-2xl font-bold">{hearts}</p>
                <p className="text-xs text-muted-foreground">Hearts</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{sessionXP}</p>
                <p className="text-xs text-muted-foreground">XP Today</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 space-y-6">
              {/* IELTS Skill Selection */}
              {selectedMode === "ielts" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Select IELTS Skill
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ieltsSkills.map((skill) => {
                      const Icon = skill.icon;
                      return (
                        <button
                          key={skill.id}
                          onClick={() => setIeltsSkill(skill.id)}
                          className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            ieltsSkill === skill.id
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-border"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{skill.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* German Level Selection */}
              {selectedMode === "german" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Select Your Level
                  </label>
                  <Select value={germanLevel} onValueChange={(v) => setGermanLevel(v as GermanLevel)}>
                    <SelectTrigger className="h-14 rounded-2xl text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {germanLevels.map((lvl) => (
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
              )}

              {/* Mode Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground block">
                  Session Options
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setVisualActivityMode(!visualActivityMode)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                      visualActivityMode ? "border-primary bg-primary/10 text-primary" : "border-border/50"
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Visual Mode
                  </button>
                  <button
                    onClick={() => setTalkOnlyMode(!talkOnlyMode)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                      talkOnlyMode ? "border-primary bg-primary/10 text-primary" : "border-border/50"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    Talk-Only Mode
                  </button>
                  <button
                    onClick={() => setSlowMode(!slowMode)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                      slowMode ? "border-primary bg-primary/10 text-primary" : "border-border/50"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Slow Mode
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-success to-emerald-400 hover:from-success/90 hover:to-emerald-400/90 shadow-lg"
                onClick={startSession}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Lesson
              </Button>
            </div>
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
                  <span className="font-medium">
                    {selectedMode === "ielts" ? `IELTS ${ieltsSkill} - Part ${ieltsPart}` :
                     selectedMode === "german" ? `German ${germanLevel}` :
                     "English Practice"}
                  </span>
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

            {/* Visual Learning Activity Mode */}
            {visualActivityMode && showVisualActivity && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4"
              >
                <VisualLearningActivity
                  language={targetLanguage}
                  level={selectedMode === "german" ? germanLevel : "A1"}
                  onComplete={(isCorrect, answer) => {
                    if (isCorrect) {
                      setSessionXP(prev => prev + 15);
                      setLessonProgress(prev => Math.min(prev + 15, 100));
                    } else {
                      setHearts(prev => Math.max(prev - 1, 0));
                    }
                    setActivityCount(prev => prev + 1);
                    
                    // Continue to next activity
                    setTimeout(() => {
                      if (lessonProgress >= 100 || activityCount >= 8) {
                        endSession();
                      } else {
                        setShowVisualActivity(false);
                        generateNextActivity();
                      }
                    }, 2000);
                  }}
                  onSpeak={(text) => speak(text, targetLanguage)}
                  onListen={toggleListening}
                  isListening={isListening}
                  transcript={transcript}
                  isSpeaking={isSpeaking}
                />
              </motion.div>
            )}

            {/* Conversation & Activities */}
            {(!visualActivityMode || !showVisualActivity) && (
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
            )}

            {/* Activity Input Area */}
            {currentActivity && !showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-2xl glass-card"
              >
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

                {isSpeakingMode && (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-primary mb-2">
                      <Mic className="w-5 h-5 animate-pulse" />
                      <span className="font-medium">Tap speak and say ONE sentence</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      I'll listen for one sentence
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
                      {isCorrectAnswer ? "Great job!" : "Not quite..."}
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

            {/* Voice Error Display */}
            <AnimatePresence>
              {speechError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-center"
                >
                  <p className="text-sm text-destructive">{speechError}</p>
                  {failedAttempts >= 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Voice paused. Please type your answer instead.
                    </p>
                  )}
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
                  <p className="text-sm text-primary font-medium mt-2 text-center animate-pulse">
                    🎤 Listening... Speak now!
                  </p>
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
                  className={`w-12 h-12 rounded-full ${talkOnlyMode ? "bg-primary/20 border-primary" : ""}`}
                  onClick={() => setTalkOnlyMode(!talkOnlyMode)}
                  title="Talk-only mode"
                >
                  <MessageCircle className="w-5 h-5" />
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
