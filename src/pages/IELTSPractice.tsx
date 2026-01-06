import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, GraduationCap, Mic, Volume2, FileText, 
  BookOpen, Headphones, Clock, Trophy, Target, CheckCircle2, 
  XCircle, ChevronRight, Play, Pause, RotateCcw
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
import IELTSListeningAudio from "@/components/IELTSListeningAudio";
import IELTSWritingChart from "@/components/IELTSWritingChart";
import { toast } from "sonner";

// IELTS Types
type IELTSModule = "listening" | "reading" | "writing" | "speaking";
type TestMode = "practice" | "half-mock" | "full-mock";
type ReadingQuestionType = "true-false-not-given" | "yes-no-not-given" | "matching-headings" | "matching-information" | "sentence-completion" | "summary-completion" | "multiple-choice" | "short-answer";

interface IELTSQuestion {
  id: string;
  type: ReadingQuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  passage?: string;
}

interface IELTSFeedback {
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  overallBand: number;
  suggestion: string;
}

const modules: { id: IELTSModule; name: string; icon: any; description: string; color: string }[] = [
  { id: "listening", name: "Listening", icon: Headphones, description: "40 questions • 4 sections • Audio-based", color: "from-blue-500 to-indigo-500" },
  { id: "reading", name: "Reading", icon: BookOpen, description: "40 questions • 3 passages • 60 minutes", color: "from-emerald-500 to-teal-500" },
  { id: "writing", name: "Writing", icon: FileText, description: "Task 1 & Task 2 • Academic format", color: "from-amber-500 to-orange-500" },
  { id: "speaking", name: "Speaking", icon: Mic, description: "3 parts • 11-14 minutes • Voice-based", color: "from-purple-500 to-pink-500" },
];

const readingQuestionTypes: { id: ReadingQuestionType; name: string }[] = [
  { id: "true-false-not-given", name: "True / False / Not Given" },
  { id: "yes-no-not-given", name: "Yes / No / Not Given" },
  { id: "matching-headings", name: "Matching Headings" },
  { id: "matching-information", name: "Matching Information" },
  { id: "sentence-completion", name: "Sentence Completion" },
  { id: "summary-completion", name: "Summary Completion" },
  { id: "multiple-choice", name: "Multiple Choice" },
  { id: "short-answer", name: "Short Answer Questions" },
];

const testModes: { id: TestMode; name: string; questions: number; time: string }[] = [
  { id: "practice", name: "Practice Mode", questions: 10, time: "15 min" },
  { id: "half-mock", name: "Half Mock", questions: 20, time: "30 min" },
  { id: "full-mock", name: "Full Mock Test", questions: 40, time: "60 min" },
];

const IELTSPractice = () => {
  // Module & Mode State
  const [selectedModule, setSelectedModule] = useState<IELTSModule | null>(null);
  const [testMode, setTestMode] = useState<TestMode>("practice");
  const [selectedQuestionType, setSelectedQuestionType] = useState<ReadingQuestionType | null>(null);
  
  // Test State
  const [isStarted, setIsStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<IELTSQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Speaking State
  const [speakingPart, setSpeakingPart] = useState(1);
  const [cueCardTopic, setCueCardTopic] = useState("");
  const [prepTime, setPrepTime] = useState(60);
  const [speakTime, setSpeakTime] = useState(0);
  const [isPrepping, setIsPrepping] = useState(false);
  const [feedback, setFeedback] = useState<IELTSFeedback | null>(null);
  
  // Writing State
  const [writingTask, setWritingTask] = useState<1 | 2>(1);
  const [writingPrompt, setWritingPrompt] = useState("");
  const [writingAnswer, setWritingAnswer] = useState("");
  const [graphImage, setGraphImage] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "table" | "process" | "map">("bar");
  const [chartDescription, setChartDescription] = useState("");
  
  // Listening State
  const [listeningAudioText, setListeningAudioText] = useState("");
  const [listeningQuestions, setListeningQuestions] = useState<IELTSQuestion[]>([]);
  const [audioPlayed, setAudioPlayed] = useState(false);
  
  // Audio & Voice
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  
  const { sendMessage, isLoading } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, hasResult } = useReliableSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useNaturalTTS();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    if (!isStarted || isPaused || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(prev - 1, 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isStarted, isPaused, timeRemaining]);

  // Prep timer for speaking
  useEffect(() => {
    if (!isPrepping || prepTime <= 0) return;
    
    const timer = setInterval(() => {
      setPrepTime(prev => {
        if (prev <= 1) {
          setIsPrepping(false);
          toast.info("Preparation time is over. Start speaking now!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPrepping, prepTime]);

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
    const questionCount = testModes.find(m => m.id === testMode)?.questions || 10;
    const questionType = selectedQuestionType || "multiple-choice";
    
    const prompt = `Generate ${questionCount} authentic IELTS Reading questions. 
Type: ${questionType}
Include a reading passage (200-300 words) and questions.

Return JSON array:
[{
  "id": "q1",
  "type": "${questionType}",
  "passage": "The passage text...",
  "question": "Question text",
  "options": ["A", "B", "C", "D"] (if applicable),
  "correctAnswer": "The correct answer"
}]`;

    try {
      const response = await sendMessage(prompt, "studybuddy", {
        conversationContext: "You are an IELTS exam question generator. Create authentic IELTS-style questions.",
      });
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]) as IELTSQuestion[];
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error("Question generation error:", error);
      // Fallback questions
      setQuestions([{
        id: "q1",
        type: "multiple-choice",
        passage: "Climate change refers to long-term shifts in temperatures and weather patterns. These shifts may be natural, such as through variations in the solar cycle. But since the 1800s, human activities have been the main driver of climate change, primarily due to burning fossil fuels like coal, oil and gas.",
        question: "According to the passage, what has been the main driver of climate change since the 1800s?",
        options: ["Natural variations", "Solar cycle changes", "Human activities", "Weather patterns"],
        correctAnswer: "Human activities"
      }]);
    }
  };

  const generateSpeakingQuestion = async () => {
    const partPrompts = {
      1: "Generate an IELTS Speaking Part 1 question about familiar topics (work, study, hometown, hobbies, family). Keep it simple and conversational.",
      2: "Generate an IELTS Speaking Part 2 cue card. Include: the topic, 3-4 bullet points to cover, and 'You should say:' format.",
      3: "Generate an IELTS Speaking Part 3 discussion question that requires deeper analysis and opinion."
    };

    try {
      const response = await sendMessage(partPrompts[speakingPart as keyof typeof partPrompts], "studybuddy", {
        conversationContext: "You are an IELTS Speaking examiner. Generate authentic questions.",
      });
      
      if (speakingPart === 2) {
        setCueCardTopic(response);
        setPrepTime(60);
        setIsPrepping(true);
      }
      
      speak(response, "english");
      return response;
    } catch (error) {
      console.error("Speaking question error:", error);
      return "Tell me about your hometown.";
    }
  };

  const generateWritingTask = async () => {
    if (writingTask === 1) {
      // Task 1 - Graph/Chart description
      const prompt = `Generate an IELTS Academic Writing Task 1 prompt. Include:
1. Type of visual (bar chart, line graph, pie chart, table, or process diagram)
2. Description of what the visual shows
3. The task instruction

Format:
"The [type] below shows [description]. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."`;

      try {
        const response = await sendMessage(prompt, "studybuddy", {
          conversationContext: "You are an IELTS examiner creating Writing Task 1 prompts.",
        });
        setWritingPrompt(response);
        // Generate a placeholder graph description
        setGraphImage("📊 [Visual representation would appear here - imagine a bar chart showing data]");
      } catch (error) {
        setWritingPrompt("The bar chart below shows the percentage of households with internet access in four different countries between 2000 and 2020. Summarise the information by selecting and reporting the main features.");
        setGraphImage("📊 Bar Chart: Internet Access by Country (2000-2020)");
      }
    } else {
      // Task 2 - Essay
      const prompt = `Generate an IELTS Academic Writing Task 2 essay question. Topics: education, technology, environment, society, health.

Format:
"[Statement about a topic]. To what extent do you agree or disagree?" or
"[Two contrasting views]. Discuss both views and give your own opinion."

Include: Write at least 250 words.`;

      try {
        const response = await sendMessage(prompt, "studybuddy", {
          conversationContext: "You are an IELTS examiner creating Writing Task 2 prompts.",
        });
        setWritingPrompt(response);
      } catch (error) {
        setWritingPrompt("Some people believe that universities should focus on providing academic knowledge, while others think they should prepare students for practical work. Discuss both views and give your own opinion. Write at least 250 words.");
      }
    }
  };

  const startTest = async () => {
    setIsStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setFeedback(null);
    
    const time = testModes.find(m => m.id === testMode)?.time || "15 min";
    const minutes = parseInt(time);
    setTimeRemaining(minutes * 60);
    
    if (selectedModule === "reading") {
      await generateQuestions();
    } else if (selectedModule === "speaking") {
      await generateSpeakingQuestion();
    } else if (selectedModule === "writing") {
      await generateWritingTask();
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
    // Calculate score
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / questions.length) * 100);
    const bandScore = Math.min(9, Math.max(1, Math.round((percentage / 100) * 9)));
    
    toast.success(`Test Complete! Score: ${correct}/${questions.length} (Band ${bandScore})`);
    setIsStarted(false);
  };

  const submitSpeakingAnswer = async (spokenText: string) => {
    const feedbackPrompt = `Rate this IELTS Speaking Part ${speakingPart} response:
"${spokenText}"

Return JSON:
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
        conversationContext: "You are an IELTS Speaking examiner providing band score feedback.",
      });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedFeedback = JSON.parse(jsonMatch[0]) as IELTSFeedback;
        setFeedback(parsedFeedback);
        
        const feedbackText = `Your estimated band score is ${parsedFeedback.overallBand}. ${parsedFeedback.suggestion}`;
        speak(feedbackText, "english");
      }
    } catch (error) {
      console.error("Feedback error:", error);
    }
    
    // Move to next part
    if (speakingPart < 3) {
      setTimeout(() => {
        setSpeakingPart(prev => prev + 1);
        setFeedback(null);
        generateSpeakingQuestion();
      }, 5000);
    }
  };

  const submitWriting = async () => {
    const wordCount = writingAnswer.trim().split(/\s+/).length;
    const minWords = writingTask === 1 ? 150 : 250;
    
    if (wordCount < minWords) {
      toast.warning(`Your response has ${wordCount} words. Minimum required: ${minWords}`);
    }
    
    const feedbackPrompt = `Evaluate this IELTS Writing Task ${writingTask} response:

Prompt: "${writingPrompt}"

Response (${wordCount} words):
"${writingAnswer}"

Provide band score feedback for:
- Task Achievement
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy

Return JSON:
{
  "taskAchievement": 6,
  "coherence": 6,
  "vocabulary": 6,
  "grammar": 6,
  "overallBand": 6,
  "feedback": "Detailed feedback"
}`;

    try {
      const response = await sendMessage(feedbackPrompt, "studybuddy", {
        conversationContext: "You are an IELTS Writing examiner.",
      });
      
      toast.success("Writing submitted! Check your feedback below.");
    } catch (error) {
      console.error("Writing feedback error:", error);
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

  // Render Module Selection
  if (!selectedModule) {
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
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold">IELTS Preparation</h1>
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
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-glow-blue"
              >
                <GraduationCap className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">IELTS Practice</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Prepare for your IELTS exam with authentic practice tests. Each module follows the official exam format.
              </p>
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
                        <h3 className="text-xl font-semibold mb-1">{module.name}</h3>
                        <p className="text-muted-foreground text-sm">{module.description}</p>
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
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl">
                  <Target className="w-6 h-6 text-primary" />
                  <span>Full Mock Test</span>
                  <span className="text-xs text-muted-foreground">All 4 sections</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl">
                  <Clock className="w-6 h-6 text-primary" />
                  <span>Half Mock</span>
                  <span className="text-xs text-muted-foreground">2 sections</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl">
                  <Trophy className="w-6 h-6 text-primary" />
                  <span>My Results</span>
                  <span className="text-xs text-muted-foreground">View progress</span>
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
              <h1 className="text-lg font-semibold">IELTS {selectedModule.charAt(0).toUpperCase() + selectedModule.slice(1)}</h1>
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
                  Select Test Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {testModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setTestMode(mode.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        testMode === mode.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <span className="font-medium block">{mode.name}</span>
                      <span className="text-xs text-muted-foreground">{mode.questions}Q • {mode.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Type Selection (Reading only) */}
              {selectedModule === "reading" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Practice by Question Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {readingQuestionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedQuestionType(type.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left text-sm ${
                          selectedQuestionType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-border"
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Writing Task Selection */}
              {selectedModule === "writing" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Select Task
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWritingTask(1)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        writingTask === 1 ? "border-primary bg-primary/10" : "border-border/50"
                      }`}
                    >
                      <span className="font-medium block">Task 1</span>
                      <span className="text-xs text-muted-foreground">Graph/Chart/Table</span>
                    </button>
                    <button
                      onClick={() => setWritingTask(2)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        writingTask === 2 ? "border-primary bg-primary/10" : "border-border/50"
                      }`}
                    >
                      <span className="font-medium block">Task 2</span>
                      <span className="text-xs text-muted-foreground">Essay</span>
                    </button>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-14 rounded-2xl text-lg font-semibold"
                onClick={startTest}
              >
                Start Test
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Render Reading Test
  if (selectedModule === "reading" && isStarted) {
    const currentQ = questions[currentQuestion];
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="font-medium">Question {currentQuestion + 1}/{questions.length}</span>
            </div>
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
              <h3 className="font-semibold mb-4">Reading Passage</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {currentQ?.passage || "Loading passage..."}
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
                  Previous
                </Button>
                
                {currentQuestion === questions.length - 1 ? (
                  <Button onClick={submitTest} className="bg-success hover:bg-success/90">
                    Submit Test
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              {/* Question Navigator */}
              <div className="glass-card rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-3">Question Navigator</p>
                <div className="grid grid-cols-10 gap-2">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(i)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        i === currentQuestion
                          ? "bg-primary text-primary-foreground"
                          : answers[q.id]
                          ? "bg-success/20 text-success"
                          : "bg-muted"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render Writing Test
  if (selectedModule === "writing" && isStarted) {
    const wordCount = writingAnswer.trim().split(/\s+/).filter(Boolean).length;
    const minWords = writingTask === 1 ? 150 : 250;
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsStarted(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="font-medium">Writing Task {writingTask}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${wordCount >= minWords ? "text-success" : "text-muted-foreground"}`}>
                {wordCount} / {minWords} words
              </span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
            {/* Task Prompt & Chart */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Task {writingTask} Prompt</h3>
                
                {writingTask === 1 && (
                  <div className="mb-6">
                    {/* Chart Type Selector */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(["bar", "line", "pie", "table", "process", "map"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setChartType(type)}
                          className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                            chartType === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    
                    {/* AI Generated Chart */}
                    <IELTSWritingChart
                      chartType={chartType}
                      topic={writingPrompt}
                      onChartGenerated={(desc) => setChartDescription(desc)}
                    />
                  </div>
                )}
                
                <p className="text-muted-foreground leading-relaxed">
                  {writingTask === 1 
                    ? chartDescription || writingPrompt 
                    : writingPrompt}
                </p>
                
                <p className="mt-4 text-sm text-primary">
                  Write at least {minWords} words.
                </p>
              </div>
            </div>

            {/* Writing Area */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Your Response</h3>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    wordCount >= minWords 
                      ? "bg-success/20 text-success" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {wordCount} words
                  </span>
                </div>
                
                <Textarea
                  value={writingAnswer}
                  onChange={(e) => setWritingAnswer(e.target.value)}
                  placeholder="Start writing your response here..."
                  className="flex-1 min-h-[400px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setWritingAnswer("")}>
                  Clear
                </Button>
                <Button onClick={submitWriting} className="bg-success hover:bg-success/90">
                  Submit Writing
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render Speaking Test
  if (selectedModule === "speaking" && isStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="font-medium">Speaking Part {speakingPart}</span>
            </div>
            <StatusIndicator status={status} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <motion.div
            className="max-w-lg w-full text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Part 2 Cue Card */}
            {speakingPart === 2 && cueCardTopic && (
              <div className="glass-card rounded-2xl p-6 text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Cue Card</h3>
                  {isPrepping && (
                    <span className="text-primary font-mono">Prep: {prepTime}s</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground">{cueCardTopic}</p>
              </div>
            )}

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
                disabled={!isSupported || isPrepping}
                size="lg"
              />
              <p className="text-sm text-muted-foreground">
                {isPrepping ? "Prepare your answer..." : "Tap to speak"}
              </p>
            </div>

            {/* Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-6 text-left"
              >
                <h3 className="font-semibold mb-4">Feedback</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Fluency</span>
                    <div className="flex items-center gap-2">
                      <Progress value={feedback.fluency * 11} className="flex-1" />
                      <span className="font-mono">{feedback.fluency}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Vocabulary</span>
                    <div className="flex items-center gap-2">
                      <Progress value={feedback.vocabulary * 11} className="flex-1" />
                      <span className="font-mono">{feedback.vocabulary}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Grammar</span>
                    <div className="flex items-center gap-2">
                      <Progress value={feedback.grammar * 11} className="flex-1" />
                      <span className="font-mono">{feedback.grammar}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Pronunciation</span>
                    <div className="flex items-center gap-2">
                      <Progress value={feedback.pronunciation * 11} className="flex-1" />
                      <span className="font-mono">{feedback.pronunciation}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/10">
                  <span className="text-primary font-semibold">Estimated Band: {feedback.overallBand}</span>
                  <p className="text-sm text-muted-foreground mt-2">{feedback.suggestion}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  // Render Listening Module
  if (selectedModule === "listening" && isStarted) {
    const sampleListeningText = `Welcome to the IELTS Listening test. You will hear a conversation between two students discussing their university project. 
    
    Sarah: Hi Tom, have you started working on our environmental science project yet?
    
    Tom: Yes, I've been researching renewable energy sources. I think we should focus on solar and wind power.
    
    Sarah: That sounds good. I found some interesting statistics about solar panel efficiency. Did you know that modern panels can convert up to 22 percent of sunlight into electricity?
    
    Tom: That's impressive. I read that wind turbines are becoming more cost-effective too. The global capacity has doubled in the last five years.
    
    Sarah: We should also mention the challenges. What about energy storage?
    
    Tom: Good point. Battery technology is improving, but it's still the main obstacle for renewable energy adoption.`;

    const listeningQs: IELTSQuestion[] = [
      {
        id: "l1",
        type: "multiple-choice",
        question: "What is the main topic of the students' project?",
        options: ["Climate change", "Renewable energy sources", "Battery technology", "Environmental pollution"],
        correctAnswer: "Renewable energy sources"
      },
      {
        id: "l2",
        type: "short-answer",
        question: "What percentage of sunlight can modern solar panels convert to electricity?",
        correctAnswer: "22 percent"
      },
      {
        id: "l3",
        type: "multiple-choice",
        question: "According to Tom, what has happened to global wind turbine capacity?",
        options: ["It has tripled", "It has doubled", "It has remained stable", "It has decreased"],
        correctAnswer: "It has doubled"
      },
      {
        id: "l4",
        type: "short-answer",
        question: "What does Tom identify as the main obstacle for renewable energy adoption?",
        correctAnswer: "Battery technology"
      }
    ];

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsStarted(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="font-medium">Listening Section {currentSection}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} / {listeningQs.length}
              </span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Audio Player */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                Audio Section {currentSection}
              </h3>
              <IELTSListeningAudio
                text={sampleListeningText}
                language="english"
                onComplete={() => setAudioPlayed(true)}
              />
              <p className="text-sm text-muted-foreground mt-3">
                Listen carefully. You will hear the audio only twice.
              </p>
            </div>

            {/* Questions */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold mb-4">
                Question {currentQuestion + 1}: {listeningQs[currentQuestion]?.question}
              </h3>
              
              {listeningQs[currentQuestion]?.options ? (
                <RadioGroup
                  value={answers[listeningQs[currentQuestion].id] || ""}
                  onValueChange={(value) => handleAnswer(listeningQs[currentQuestion].id, value)}
                  className="space-y-3"
                >
                  {listeningQs[currentQuestion].options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={option} id={`l-option-${i}`} />
                      <Label htmlFor={`l-option-${i}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <input
                  type="text"
                  value={answers[listeningQs[currentQuestion]?.id] || ""}
                  onChange={(e) => handleAnswer(listeningQs[currentQuestion].id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full p-4 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-primary"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentQuestion === listeningQs.length - 1 ? (
                <Button onClick={submitTest} className="bg-success hover:bg-success/90">
                  Submit Answers
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestion(prev => prev + 1)}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen flex flex-col bg-background items-center justify-center">
      <div className="text-center">
        <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">IELTS Practice</h2>
        <p className="text-muted-foreground mb-6">Select a module to begin</p>
        <Button variant="outline" onClick={() => setSelectedModule(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modules
        </Button>
      </div>
    </div>
  );
};

export default IELTSPractice;
