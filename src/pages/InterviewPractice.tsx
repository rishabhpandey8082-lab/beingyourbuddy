import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Video, VideoOff, User, Briefcase, Brain, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import Avatar3D from "@/components/Avatar3D";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useCamera } from "@/hooks/useCamera";
import VoiceOrb from "@/components/VoiceOrb";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { toast } from "sonner";

const interviewTypes = [
  { id: "hr", name: "HR Interview", description: "Behavioral & culture fit", icon: Users, color: "from-blue-500 to-indigo-500" },
  { id: "technical", name: "Technical Interview", description: "Problem-solving & coding", icon: Brain, color: "from-purple-500 to-violet-500" },
  { id: "finance", name: "Finance Interview", description: "Financial analysis & cases", icon: Building, color: "from-emerald-500 to-teal-500" },
  { id: "management", name: "Management Interview", description: "Leadership & strategy", icon: Briefcase, color: "from-orange-500 to-amber-500" },
];

interface Message {
  id: string;
  role: "user" | "interviewer";
  content: string;
  feedback?: {
    communication: number;
    confidence: number;
    clarity: number;
  };
}

const InterviewPractice = () => {
  const [interviewType, setInterviewType] = useState("hr");
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();
  const { videoRef, isEnabled: cameraEnabled, isLoading: cameraLoading, toggleCamera } = useCamera();

  const selectedType = interviewTypes.find((t) => t.id === interviewType);

  // Update status
  useEffect(() => {
    if (isListening) setStatus("listening");
    else if (isLoading) setStatus("thinking");
    else if (isSpeaking || isTTSLoading) setStatus("speaking");
    else setStatus("idle");
  }, [isListening, isLoading, isSpeaking, isTTSLoading]);

  // Update current question from streaming
  useEffect(() => {
    if (currentResponse) setCurrentQuestion(currentResponse);
  }, [currentResponse]);

  // Handle voice input completion
  useEffect(() => {
    if (!isListening && transcript.trim() && isStarted) {
      handleUserResponse(transcript.trim());
      resetTranscript();
    }
  }, [isListening, isStarted]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const startInterview = async () => {
    clearHistory();
    setMessages([]);
    setQuestionCount(0);
    setIsStarted(true);

    const greeting = `Hello and welcome! I'm your ${selectedType?.name} interviewer today. Take a moment to relax and when you're ready, let's begin. First, can you tell me a little about yourself and your background?`;

    setCurrentQuestion(greeting);
    setMessages([{ id: crypto.randomUUID(), role: "interviewer", content: greeting }]);
    setQuestionCount(1);
    speak(greeting);
  };

  const handleUserResponse = async (userText: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userText }]);
    setCurrentQuestion("");

    try {
      const systemContext = `You are a professional ${selectedType?.name} interviewer. 

Your approach:
- Ask one clear question at a time
- Listen carefully and respond naturally to what the candidate says
- Provide brief, constructive feedback when appropriate
- Keep responses under 3 sentences usually
- Be professional but warm and encouraging
- After each answer, either ask a follow-up or move to the next topic
- For ${selectedType?.name}: Focus on ${selectedType?.description?.toLowerCase()}

Remember: This is question ${questionCount + 1}. After about 5-7 questions, start wrapping up the interview naturally.`;

      const response = await sendMessage(userText, "interviewer", {
        conversationContext: systemContext,
      });

      setCurrentQuestion(response);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "interviewer", content: response }]);
      setQuestionCount((prev) => prev + 1);
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

  const endInterview = () => {
    stopSpeaking();
    stopListening();
    setIsStarted(false);
    setMessages([]);
    setCurrentQuestion("");
    clearHistory();
    toast.success("Interview session ended. Great practice!");
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
              <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${selectedType?.color || "from-orange-500 to-red-500"} flex items-center justify-center`}>
                {selectedType?.icon && <selectedType.icon className="h-4 w-4 text-white" />}
              </div>
              <h1 className="text-lg font-semibold">Interview Practice</h1>
            </div>
          </div>

          {isStarted && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl glass-card text-sm font-medium">
                Question {questionCount}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-6">
        {!isStarted ? (
          /* Setup Screen */
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
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 flex items-center justify-center shadow-glow"
              >
                <Briefcase className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">Face-to-Face Practice</h2>
              <p className="text-muted-foreground text-lg">
                Practice with an AI interviewer
              </p>
            </div>

            {/* Interview Type Selection */}
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Interview Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {interviewTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setInterviewType(type.id)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          interviewType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-border"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-semibold text-sm">{type.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className={`w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r ${selectedType?.color} hover:opacity-90 shadow-lg`}
                onClick={startInterview}
              >
                Start Interview
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Interview Screen */
          <motion.div
            className="w-full max-w-5xl flex flex-col flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{selectedType?.name}</span>
                <Button variant="ghost" size="sm" onClick={endInterview} className="rounded-xl text-muted-foreground">
                  End Interview
                </Button>
              </div>
              <Progress value={Math.min((questionCount / 7) * 100, 100)} className="h-1.5" />
            </div>

            {/* Main Content - Video feeds */}
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 mb-6">
              {/* AI Avatar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div className={`absolute -inset-4 rounded-3xl bg-gradient-to-br ${selectedType?.color} opacity-20 blur-xl`} />
                  <div className="relative">
                    <Avatar3D isSpeaking={isSpeaking} isListening={isListening} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 font-medium">AI Interviewer</p>
              </motion.div>

              {/* User Camera */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-center"
              >
                <AnimatePresence mode="wait">
                  {cameraEnabled ? (
                    <motion.div
                      key="camera"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative"
                    >
                      <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-xl" />
                      <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden glass-card border-2 border-primary/30">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{ transform: "scaleX(-1)" }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-48 h-48 lg:w-56 lg:h-56 rounded-2xl glass-card border-2 border-dashed border-border/50 flex flex-col items-center justify-center"
                    >
                      <User className="w-12 h-12 text-muted-foreground/30 mb-3" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={toggleCamera}
                        disabled={cameraLoading}
                      >
                        {cameraLoading ? "Starting..." : "Enable Camera"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-sm text-muted-foreground mt-3 font-medium">You</p>
              </motion.div>
            </div>

            {/* Current Question / Subtitles */}
            <AnimatePresence>
              {currentQuestion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <div className="glass-card rounded-2xl p-4 max-w-2xl mx-auto">
                    <p className="text-center leading-relaxed">{currentQuestion}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && !currentResponse && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 mb-6"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </motion.div>
            )}

            {/* Voice visualization */}
            <AnimatePresence>
              {status === "listening" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <WaveformVisualizer isActive={true} className="h-16 max-w-md mx-auto" />
                  {transcript && (
                    <p className="text-sm text-muted-foreground mt-3 text-center italic">"{transcript}"</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/40">
              <StatusIndicator status={status} />

              <div className="flex items-center gap-6">
                {/* Camera toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`w-14 h-14 rounded-full ${cameraEnabled ? "bg-primary/20 border-primary" : ""}`}
                  onClick={toggleCamera}
                  disabled={cameraLoading}
                >
                  {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>

                {/* Main mic button */}
                <VoiceOrb
                  status={status}
                  onClick={toggleListening}
                  disabled={!isSupported}
                  size="lg"
                />

                {/* Spacer */}
                <div className="w-14 h-14" />
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default InterviewPractice;
