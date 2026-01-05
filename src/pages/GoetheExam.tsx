import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Globe, Mic, Volume2, FileText, 
  BookOpen, Headphones, Clock, Trophy, Target, CheckCircle2, 
  XCircle, ChevronRight, Play, Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useReliableSpeechRecognition } from "@/hooks/useReliableSpeechRecognition";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import VoiceOrb from "@/components/VoiceOrb";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { toast } from "sonner";

// Goethe Types
type GoetheLevel = "A1" | "A2" | "B1" | "B2" | "C1";
type GoetheModule = "lesen" | "hoeren" | "schreiben" | "sprechen";
type TestMode = "practice" | "mock";

interface GoetheQuestion {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  passage?: string;
}

const levels: { id: GoetheLevel; name: string; description: string }[] = [
  { id: "A1", name: "A1 - Start Deutsch", description: "Basic phrases & greetings" },
  { id: "A2", name: "A2 - Fit in Deutsch", description: "Simple conversations" },
  { id: "B1", name: "B1 - Zertifikat", description: "Independent speaker" },
  { id: "B2", name: "B2 - Mittelstufe", description: "Complex discussions" },
  { id: "C1", name: "C1 - Oberstufe", description: "Near-native fluency" },
];

const modules: { id: GoetheModule; name: string; germanName: string; icon: any; color: string }[] = [
  { id: "lesen", name: "Reading", germanName: "Lesen", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
  { id: "hoeren", name: "Listening", germanName: "Hören", icon: Headphones, color: "from-blue-500 to-indigo-500" },
  { id: "schreiben", name: "Writing", germanName: "Schreiben", icon: FileText, color: "from-amber-500 to-orange-500" },
  { id: "sprechen", name: "Speaking", germanName: "Sprechen", icon: Mic, color: "from-purple-500 to-pink-500" },
];

const readingTaskTypes = [
  "Multiple Choice",
  "Matching Headings",
  "True / False",
  "Fill in the blanks",
  "Short answer",
];

const GoetheExam = () => {
  // Level & Module State
  const [selectedLevel, setSelectedLevel] = useState<GoetheLevel | null>(null);
  const [selectedModule, setSelectedModule] = useState<GoetheModule | null>(null);
  const [testMode, setTestMode] = useState<TestMode>("practice");
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  
  // Test State
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<GoetheQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Writing State
  const [writingPrompt, setWritingPrompt] = useState("");
  const [writingAnswer, setWritingAnswer] = useState("");
  
  // Speaking State
  const [speakingTask, setSpeakingTask] = useState(1);
  const [feedback, setFeedback] = useState<any>(null);
  
  // Audio & Voice
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  
  const { sendMessage, isLoading } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, hasResult } = useReliableSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useNaturalTTS();

  // Timer effect
  useEffect(() => {
    if (!isStarted || isPaused || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(prev - 1, 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isStarted, isPaused, timeRemaining]);

  // Update status
  useEffect(() => {
    if (isListening) setStatus("listening");
    else if (isLoading) setStatus("thinking");
    else if (isSpeaking || isTTSLoading) setStatus("speaking");
    else setStatus("idle");
  }, [isListening, isLoading, isSpeaking, isTTSLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateQuestions = async () => {
    const taskType = selectedTaskType || "Multiple Choice";
    
    const prompt = `Generate 10 authentic Goethe ${selectedLevel} level German Reading (Lesen) questions.
Task Type: ${taskType}
Include a German reading text and questions.

Return JSON array:
[{
  "id": "q1",
  "type": "${taskType}",
  "passage": "German text...",
  "question": "Question in German",
  "options": ["A", "B", "C", "D"] (if applicable),
  "correctAnswer": "The correct answer"
}]`;

    try {
      const response = await sendMessage(prompt, "studybuddy", {
        conversationContext: `You are a Goethe exam question generator for ${selectedLevel} level.`,
      });
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]) as GoetheQuestion[];
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error("Question generation error:", error);
      // Fallback
      setQuestions([{
        id: "q1",
        type: "Multiple Choice",
        passage: "Hallo! Ich heiße Anna. Ich wohne in Berlin. Berlin ist eine große Stadt in Deutschland.",
        question: "Wo wohnt Anna?",
        options: ["München", "Berlin", "Hamburg", "Köln"],
        correctAnswer: "Berlin"
      }]);
    }
  };

  const generateWritingTask = async () => {
    const writingPrompts: Record<GoetheLevel, string> = {
      A1: "Write a short email (30-40 words) introducing yourself to a new German friend. Include your name, age, and one hobby.",
      A2: "Write an email (50-60 words) to your friend about your plans for the weekend.",
      B1: "Write a letter (80-100 words) responding to a job advertisement.",
      B2: "Write an essay (150-180 words) about the advantages and disadvantages of working from home.",
      C1: "Write a formal complaint letter (200-250 words) about a service you were not satisfied with.",
    };
    
    setWritingPrompt(writingPrompts[selectedLevel!] || writingPrompts.A1);
  };

  const generateSpeakingTask = async () => {
    const taskPrompts: Record<GoetheLevel, string[]> = {
      A1: ["Stellen Sie sich vor (Introduce yourself)", "Beschreiben Sie Ihre Familie (Describe your family)"],
      A2: ["Erzählen Sie über Ihren Tagesablauf (Tell about your daily routine)", "Beschreiben Sie Ihr Lieblingsessen (Describe your favorite food)"],
      B1: ["Diskutieren Sie die Vor- und Nachteile von Social Media", "Erzählen Sie über eine Reise, die Sie gemacht haben"],
      B2: ["Präsentieren Sie Ihre Meinung zu Umweltschutz", "Diskutieren Sie über die Zukunft der Arbeit"],
      C1: ["Analysieren Sie einen aktuellen Trend in der Gesellschaft", "Diskutieren Sie ethische Fragen der Technologie"],
    };
    
    const tasks = taskPrompts[selectedLevel!] || taskPrompts.A1;
    const task = tasks[speakingTask - 1] || tasks[0];
    speak(task, "german");
    return task;
  };

  const startTest = async () => {
    setIsStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setFeedback(null);
    setTimeRemaining(30 * 60); // 30 minutes
    
    if (selectedModule === "lesen") {
      await generateQuestions();
    } else if (selectedModule === "schreiben") {
      await generateWritingTask();
    } else if (selectedModule === "sprechen") {
      await generateSpeakingTask();
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitTest = async () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= 60;
    
    toast[passed ? "success" : "error"](
      `Test Complete! Score: ${correct}/${questions.length} (${percentage}%) - ${passed ? "Passed!" : "Try again"}`
    );
    setIsStarted(false);
  };

  const submitSpeakingAnswer = async (spokenText: string) => {
    const feedbackPrompt = `Evaluate this Goethe ${selectedLevel} Speaking response in German:
"${spokenText}"

Provide feedback on:
- Aussprache (Pronunciation)
- Wortschatz (Vocabulary)
- Grammatik (Grammar)
- Flüssigkeit (Fluency)

Return JSON:
{
  "pronunciation": 3,
  "vocabulary": 3,
  "grammar": 3,
  "fluency": 3,
  "passed": true,
  "feedback": "Specific feedback in German and English"
}

Score out of 5 for each category.`;

    try {
      const response = await sendMessage(feedbackPrompt, "studybuddy", {
        conversationContext: `You are a Goethe exam speaking evaluator for ${selectedLevel} level.`,
      });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedFeedback = JSON.parse(jsonMatch[0]);
        setFeedback(parsedFeedback);
      }
    } catch (error) {
      console.error("Feedback error:", error);
    }
  };

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input not supported");
      return;
    }
    
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        submitSpeakingAnswer(transcript);
      }
    } else {
      stopSpeaking();
      resetTranscript();
      startListening();
    }
  }, [isListening, isSupported, startListening, stopListening, transcript, stopSpeaking]);

  // Render Level Selection
  if (!selectedLevel) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Link to="/language">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold">Goethe Exam Preparation</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-glow"
              >
                <span className="text-4xl">🇩🇪</span>
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">Goethe-Zertifikat</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Prepare for your Goethe German exam. Select your level to start practicing.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              {levels.map((level, index) => (
                <motion.button
                  key={level.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedLevel(level.id)}
                  className="w-full p-6 rounded-2xl glass-card hover:scale-[1.01] transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{level.name}</h3>
                      <p className="text-muted-foreground">{level.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Render Module Selection
  if (!selectedModule) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedLevel(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Goethe {selectedLevel}</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2">Select Module</h2>
              <p className="text-muted-foreground">Choose which skill to practice</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.button
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedModule(module.id)}
                    className="p-6 rounded-2xl glass-card hover:scale-[1.02] transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{module.germanName}</h3>
                        <p className="text-muted-foreground text-sm">{module.name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Mock Test Options */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4 text-center">Mock Tests</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl">
                  <Target className="w-6 h-6 text-primary" />
                  <span>Full Mock Test</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl">
                  <Trophy className="w-6 h-6 text-primary" />
                  <span>My Results</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Render Module Setup (before starting test)
  if (!isStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedModule(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {modules.find(m => m.id === selectedModule)?.germanName} - {selectedLevel}
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <motion.div
            className="max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-card rounded-3xl p-6 space-y-6">
              {/* Test Mode Selection */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Test Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTestMode("practice")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      testMode === "practice" ? "border-primary bg-primary/10" : "border-border/50"
                    }`}
                  >
                    <span className="font-medium">Practice</span>
                  </button>
                  <button
                    onClick={() => setTestMode("mock")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      testMode === "mock" ? "border-primary bg-primary/10" : "border-border/50"
                    }`}
                  >
                    <span className="font-medium">Mock Test</span>
                  </button>
                </div>
              </div>

              {/* Task Type Selection (Lesen only) */}
              {selectedModule === "lesen" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Practice by Task Type
                  </label>
                  <div className="space-y-2">
                    {readingTaskTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedTaskType(type)}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left text-sm ${
                          selectedTaskType === type
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-border"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-14 rounded-2xl text-lg font-semibold"
                onClick={startTest}
              >
                Start {testMode === "practice" ? "Practice" : "Mock Test"}
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Render Reading Test
  if (selectedModule === "lesen" && isStarted) {
    const currentQ = questions[currentQuestion];
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <span className="font-medium">Frage {currentQuestion + 1}/{questions.length}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {/* Passage */}
            <ScrollArea className="h-[60vh] glass-card rounded-2xl p-4">
              <h3 className="font-semibold mb-4">Lesetext</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {currentQ?.passage || "Loading..."}
              </p>
            </ScrollArea>

            {/* Question */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-4">
                <h3 className="font-semibold mb-4">{currentQ?.question}</h3>
                
                {currentQ?.options && (
                  <RadioGroup
                    value={answers[currentQ.id] || ""}
                    onValueChange={(value) => handleAnswer(currentQ.id, value)}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                        <RadioGroupItem value={option} id={`option-${i}`} />
                        <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                
                {currentQuestion === questions.length - 1 ? (
                  <Button onClick={submitTest} className="bg-success hover:bg-success/90">
                    Abgeben
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>
                    Weiter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render Writing Test
  if (selectedModule === "schreiben" && isStarted) {
    const wordCount = writingAnswer.trim().split(/\s+/).filter(Boolean).length;
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <span className="font-medium">Schreiben - {selectedLevel}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{wordCount} Wörter</span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Schreibaufgabe</h3>
              <p className="text-muted-foreground leading-relaxed">{writingPrompt}</p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Textarea
                value={writingAnswer}
                onChange={(e) => setWritingAnswer(e.target.value)}
                placeholder="Schreiben Sie hier Ihre Antwort..."
                className="min-h-[300px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 bg-transparent"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => {
                toast.success("Schreiben eingereicht!");
                setIsStarted(false);
              }} className="bg-success hover:bg-success/90">
                Abgeben
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render Speaking Test
  if (selectedModule === "sprechen" && isStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <span className="font-medium">Sprechen - Aufgabe {speakingTask}</span>
            <StatusIndicator status={status} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <motion.div
            className="max-w-lg w-full text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Voice Visualization */}
            <AnimatePresence>
              {status === "listening" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <WaveformVisualizer isActive={true} className="h-16" />
                  {transcript && (
                    <p className="text-sm text-muted-foreground mt-4 italic">"{transcript}"</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Orb */}
            <div className="flex flex-col items-center gap-4">
              <VoiceOrb
                status={status}
                onClick={toggleListening}
                disabled={!isSupported}
                size="lg"
              />
              <p className="text-sm text-muted-foreground">
                Tippen Sie zum Sprechen
              </p>
            </div>

            {/* Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-6 text-left"
              >
                <h3 className="font-semibold mb-4">Bewertung</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Aussprache</span>
                    <Progress value={feedback.pronunciation * 20} className="mt-1" />
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Wortschatz</span>
                    <Progress value={feedback.vocabulary * 20} className="mt-1" />
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Grammatik</span>
                    <Progress value={feedback.grammar * 20} className="mt-1" />
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Flüssigkeit</span>
                    <Progress value={feedback.fluency * 20} className="mt-1" />
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${feedback.passed ? "bg-success/10" : "bg-destructive/10"}`}>
                  <span className={`font-semibold ${feedback.passed ? "text-success" : "text-destructive"}`}>
                    {feedback.passed ? "Bestanden!" : "Nicht bestanden"}
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">{feedback.feedback}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  // Default listening module placeholder
  return (
    <div className="min-h-screen flex flex-col bg-background items-center justify-center">
      <div className="text-center">
        <Headphones className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">Hören</h2>
        <p className="text-muted-foreground mb-6">Coming soon with audio-based practice</p>
        <Button variant="outline" onClick={() => setSelectedModule(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
      </div>
    </div>
  );
};

export default GoetheExam;
