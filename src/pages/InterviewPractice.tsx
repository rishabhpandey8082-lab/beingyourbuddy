import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Avatar3D from "@/components/Avatar3D";
import Subtitles from "@/components/Subtitles";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "sonner";

const interviewTypes = [
  { id: "hr", name: "HR Interview", description: "Behavioral questions, culture fit" },
  { id: "technical", name: "Technical Interview", description: "Problem-solving, coding questions" },
  { id: "finance", name: "Finance Interview", description: "Financial analysis, case studies" },
  { id: "management", name: "Management Interview", description: "Leadership, strategy questions" },
];

const InterviewPractice = () => {
  const [interviewType, setInterviewType] = useState("hr");
  const [customRole, setCustomRole] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  const selectedType = interviewTypes.find((t) => t.id === interviewType);

  // Update status
  useEffect(() => {
    if (isListening) setStatus("listening");
    else if (isLoading) setStatus("thinking");
    else if (isSpeaking || isTTSLoading) setStatus("speaking");
    else setStatus("idle");
  }, [isListening, isLoading, isSpeaking, isTTSLoading]);

  // Update display text
  useEffect(() => {
    if (currentResponse) setDisplayText(currentResponse);
  }, [currentResponse]);

  // Handle voice input completion
  useEffect(() => {
    if (!isListening && transcript.trim() && isStarted) {
      handleUserResponse(transcript.trim());
      resetTranscript();
    }
  }, [isListening, isStarted]);

  const startInterview = async () => {
    clearHistory();
    setIsStarted(true);

    const greeting = `Hello! Welcome to your ${selectedType?.name}. I'm here to help you practice. Take a deep breath and let's begin. Can you start by telling me a bit about yourself?`;
    
    setDisplayText(greeting);
    speak(greeting);
  };

  const handleUserResponse = async (userText: string) => {
    setDisplayText("");

    try {
      const systemContext = `You are a professional interviewer conducting a ${selectedType?.name}. 
        - Ask one question at a time
        - Listen carefully and respond naturally
        - Provide brief, constructive feedback when appropriate
        - Keep the conversation professional but warm
        - After each answer, either ask a follow-up or move to the next topic
        - Don't be too long - keep responses under 3 sentences usually`;

      const response = await sendMessage(userText, "interviewer", {
        conversationContext: systemContext,
      });

      setDisplayText(response);
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
    setDisplayText("");
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
        <h1 className="text-xl font-semibold gradient-text">Interview Practice</h1>
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
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Face-to-Face Practice</h2>
              <p className="text-muted-foreground">
                Practice with an AI interviewer avatar
              </p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Interview Type
                </label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div>{type.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full h-12" onClick={startInterview}>
                Start Interview
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Interview screen */
          <motion.div
            className="w-full max-w-4xl flex flex-col flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Interview type badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full glass text-sm">
                {selectedType?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={endInterview}>
                End Interview
              </Button>
            </div>

            {/* Avatar section */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <Avatar3D isSpeaking={isSpeaking} isListening={isListening} />
              
              {/* Subtitles */}
              <div className="mt-6 w-full max-w-xl">
                <Subtitles 
                  text={displayText} 
                  isVisible={!!displayText || isLoading} 
                />
                {isLoading && !displayText && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm">Thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 mt-8">
              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {status === "listening" && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening to you...
                  </>
                )}
                {status === "thinking" && "Processing..."}
                {status === "speaking" && "Interviewer is speaking..."}
                {status === "idle" && "Your turn to speak"}
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-4">
                {/* Camera toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  className="w-14 h-14 rounded-full"
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                >
                  {cameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>

                {/* Main mic button */}
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

                {/* Spacer for symmetry */}
                <div className="w-14 h-14" />
              </div>

              {/* Transcript preview */}
              {isListening && transcript && (
                <p className="text-sm text-muted-foreground italic max-w-md text-center">
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

export default InterviewPractice;
