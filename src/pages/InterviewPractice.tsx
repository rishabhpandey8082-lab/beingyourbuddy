import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Video, VideoOff, User, Briefcase, Brain, Building, Users, FileText, Sparkles, CheckCircle2, Loader2, Award, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import Avatar3D from "@/components/Avatar3D";
import { useChat } from "@/hooks/useChat";
import { useReliableSpeechRecognition } from "@/hooks/useReliableSpeechRecognition";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import { useCamera } from "@/hooks/useCamera";
import VoiceOrb from "@/components/VoiceOrb";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import InterviewReport from "@/components/InterviewReport";
import InterviewStages, { getInterviewStagePrompt } from "@/components/InterviewStages";
import { toast } from "sonner";

const interviewTypes = [
  { id: "jd", name: "Job Description", description: "Custom interview from JD", icon: FileText, color: "from-rose-500 to-pink-500" },
  { id: "hr", name: "HR Interview", description: "Behavioral & culture fit", icon: Users, color: "from-blue-500 to-indigo-500" },
  { id: "technical", name: "Technical Interview", description: "Problem-solving & coding", icon: Brain, color: "from-purple-500 to-violet-500" },
  { id: "finance", name: "Finance Interview", description: "Financial analysis & cases", icon: Building, color: "from-emerald-500 to-teal-500" },
  { id: "management", name: "Management Interview", description: "Leadership & strategy", icon: Briefcase, color: "from-orange-500 to-amber-500" },
];

interface JDAnalysis {
  role: string;
  skills: string[];
  responsibilities: string[];
  experienceLevel: string;
  keywords: string[];
}

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
  const [pendingVoiceConfirm, setPendingVoiceConfirm] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // JD-based interview states
  const [jobDescription, setJobDescription] = useState("");
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysis | null>(null);
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [showJDInput, setShowJDInput] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, hasResult, error: speechError, failedAttempts } = useReliableSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useNaturalTTS();
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

  // Handle voice input completion - show confirmation
  useEffect(() => {
    if (!isListening && hasResult && transcript.trim() && isStarted) {
      setPendingVoiceConfirm(transcript.trim());
    }
  }, [isListening, hasResult, transcript, isStarted]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Analyze Job Description
  const analyzeJobDescription = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first");
      return;
    }

    setIsAnalyzingJD(true);
    try {
      const analysisPrompt = `Analyze this job description and extract structured information. Return ONLY valid JSON with this exact structure:
{
  "role": "job title",
  "skills": ["skill1", "skill2", ...],
  "responsibilities": ["resp1", "resp2", ...],
  "experienceLevel": "entry/mid/senior/executive",
  "keywords": ["keyword1", "keyword2", ...]
}

Job Description:
${jobDescription}`;

      const response = await sendMessage(analysisPrompt, "friend", {});
      
      // Parse the JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]) as JDAnalysis;
        setJdAnalysis(analysis);
        toast.success("Job description analyzed successfully!");
      } else {
        throw new Error("Could not parse analysis");
      }
    } catch (error) {
      console.error("JD analysis error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const startInterview = async () => {
    clearHistory();
    setMessages([]);
    setQuestionCount(0);
    setIsStarted(true);

    let greeting: string;
    
    if (interviewType === "jd" && jdAnalysis) {
      greeting = `Hello and welcome! I'm your interviewer for the ${jdAnalysis.role} position today. I've reviewed the job requirements carefully. Take a moment to relax, and when you're ready, let's begin. First, can you walk me through your background and why you're interested in this ${jdAnalysis.role} role?`;
    } else {
      greeting = `Hello and welcome! I'm your ${selectedType?.name} interviewer today. Take a moment to relax and when you're ready, let's begin. First, can you tell me a little about yourself and your background?`;
    }

    setCurrentQuestion(greeting);
    setMessages([{ id: crypto.randomUUID(), role: "interviewer", content: greeting }]);
    setQuestionCount(1);
    speak(greeting);
  };

  const handleUserResponse = async (userText: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userText }]);
    setCurrentQuestion("");

    try {
      // Get stage-specific prompt for structured interview flow
      const stagePrompt = getInterviewStagePrompt(questionCount + 1, jdAnalysis);
      
      let systemContext: string;
      
      if (interviewType === "jd" && jdAnalysis) {
        systemContext = `You are a professional interviewer conducting a REAL MOCK INTERVIEW for ${jdAnalysis.role}.

${stagePrompt}

JOB CONTEXT:
- Role: ${jdAnalysis.role}
- Skills: ${jdAnalysis.skills.slice(0, 5).join(", ")}
- Level: ${jdAnalysis.experienceLevel}

INTERVIEW STYLE (CRITICAL):
1. Sound like a REAL HUMAN interviewer, not AI
2. Ask ONE clear question at a time
3. Keep responses SHORT (2-3 sentences max)
4. After EACH answer, give:
   - Brief acknowledgment ("That's interesting..." / "I see...")
   - One specific improvement tip
   - Then ask next question
5. Use natural transitions ("Let me ask you about..." / "Moving on...")
6. Be professional but warm

This is question ${questionCount + 1} of approximately 7-8 total.`;
      } else {
        systemContext = `You are a professional ${selectedType?.name} interviewer conducting a REAL interview.

${stagePrompt}

INTERVIEW STYLE:
1. Sound human and natural, not robotic
2. Ask ONE question at a time
3. Keep responses under 3 sentences
4. Give brief feedback after each answer
5. Be professional but encouraging
6. Use natural conversation flow

Question ${questionCount + 1} of ~7. Focus on: ${selectedType?.description?.toLowerCase()}`;
      }

      const response = await sendMessage(userText, "interviewer", {
        conversationContext: systemContext,
      });

      setCurrentQuestion(response);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "interviewer", content: response }]);
      setQuestionCount((prev) => prev + 1);
      speak(response, "english");
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
      setPendingVoiceConfirm(null);
      resetTranscript();
      startListening();
    }
  }, [isListening, isSupported, startListening, stopListening, stopSpeaking, resetTranscript]);

  const confirmVoiceInput = () => {
    if (pendingVoiceConfirm) {
      handleUserResponse(pendingVoiceConfirm);
      setPendingVoiceConfirm(null);
      resetTranscript();
    }
  };

  const retryVoiceInput = () => {
    setPendingVoiceConfirm(null);
    resetTranscript();
    startListening();
  };

  const endInterview = (showReportModal = false) => {
    stopSpeaking();
    stopListening();
    setPendingVoiceConfirm(null);
    
    if (showReportModal && interviewType === "jd" && jdAnalysis && questionCount >= 2) {
      setShowReport(true);
    } else {
      resetInterviewState();
    }
  };

  const resetInterviewState = () => {
    setIsStarted(false);
    setMessages([]);
    setCurrentQuestion("");
    setShowJDInput(false);
    setJdAnalysis(null);
    setJobDescription("");
    setShowReport(false);
    setPendingVoiceConfirm(null);
    clearHistory();
    toast.success("Interview session ended. Great practice!");
  };

  const handleTypeSelect = (typeId: string) => {
    setInterviewType(typeId);
    if (typeId === "jd") {
      setShowJDInput(true);
    } else {
      setShowJDInput(false);
      setJdAnalysis(null);
      setJobDescription("");
    }
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
                        onClick={() => handleTypeSelect(type.id)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          interviewType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-border"
                        } ${type.id === "jd" ? "col-span-2" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{type.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                            {type.id === "jd" && (
                              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI-powered custom interview
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* JD Input Section */}
              <AnimatePresence>
                {showJDInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Paste Job Description</span>
                      </div>
                      <Textarea
                        placeholder="Paste the full job description here... Include job title, responsibilities, required skills, and qualifications."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="min-h-[150px] bg-background/50 border-border/50 rounded-xl resize-none"
                        disabled={isAnalyzingJD || !!jdAnalysis}
                      />
                      
                      {!jdAnalysis && (
                        <Button
                          onClick={analyzeJobDescription}
                          disabled={isAnalyzingJD || !jobDescription.trim()}
                          className="w-full mt-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90"
                        >
                          {isAnalyzingJD ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Analyze Job Description
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Analysis Results */}
                    {jdAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Analysis Complete</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Role:</span>
                            <span className="text-sm font-medium">{jdAnalysis.role}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Level:</span>
                            <span className="text-sm capitalize">{jdAnalysis.experienceLevel}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Skills:</span>
                            <div className="flex flex-wrap gap-1">
                              {jdAnalysis.skills.slice(0, 5).map((skill, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {skill}
                                </span>
                              ))}
                              {jdAnalysis.skills.length > 5 && (
                                <span className="text-xs text-muted-foreground">+{jdAnalysis.skills.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setJdAnalysis(null);
                            setJobDescription("");
                          }}
                          className="w-full mt-2 rounded-xl text-xs"
                        >
                          Use Different JD
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className={`w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r ${selectedType?.color} hover:opacity-90 shadow-lg`}
                onClick={startInterview}
                disabled={interviewType === "jd" && !jdAnalysis}
              >
                {interviewType === "jd" && !jdAnalysis ? "Analyze JD First" : "Start Interview"}
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
            {/* Interview Stages Progress */}
            <div className="mb-4">
              <InterviewStages currentStage="" questionCount={questionCount} />
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {interviewType === "jd" && jdAnalysis ? jdAnalysis.role : selectedType?.name}
                </span>
                <Button variant="ghost" size="sm" onClick={() => endInterview(true)} className="rounded-xl text-muted-foreground">
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

            {/* Voice confirmation dialog */}
            <AnimatePresence>
              {pendingVoiceConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 rounded-2xl bg-muted/50 border border-border/50 max-w-md mx-auto"
                >
                  <p className="text-sm text-muted-foreground mb-2 text-center">I heard:</p>
                  <p className="text-base font-medium mb-4 text-center">"{pendingVoiceConfirm}"</p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={confirmVoiceInput}
                      className="rounded-xl bg-primary"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Correct
                    </Button>
                    <Button
                      variant="outline"
                      onClick={retryVoiceInput}
                      className="rounded-xl"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
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
                  className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-center max-w-md mx-auto"
                >
                  <p className="text-sm text-destructive">{speechError}</p>
                  {failedAttempts >= 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Voice unavailable. Please type your answer.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice visualization */}
            <AnimatePresence>
              {status === "listening" && !pendingVoiceConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <WaveformVisualizer isActive={true} className="h-16 max-w-md mx-auto" />
                  <p className="text-sm text-primary font-medium mt-3 text-center animate-pulse">
                    🎤 Listening... Speak your answer now!
                  </p>
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

      {/* Interview Report Modal */}
      <AnimatePresence>
        {showReport && jdAnalysis && (
          <InterviewReport
            role={jdAnalysis.role}
            experienceLevel={jdAnalysis.experienceLevel}
            questionCount={questionCount}
            messages={messages}
            onClose={resetInterviewState}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewPractice;
