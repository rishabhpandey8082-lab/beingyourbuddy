import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, MicOff, Volume2, VolumeX, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/useChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "sonner";

const AISearch = () => {
  const [query, setQuery] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [results, setResults] = useState<{ query: string; response: string }[]>([]);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading, currentResponse } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS();

  // Auto-scroll to latest result
  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [results, currentResponse]);

  // Handle voice input completion
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleSearch(transcript.trim());
      resetTranscript();
    }
  }, [isListening]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim();
    setQuery("");

    try {
      const response = await sendMessage(q, "friend", {
        conversationContext: "User is searching for information. Provide clear, direct answers without unnecessary fluff.",
      });

      setResults((prev) => [...prev, { query: q, response }]);

      if (voiceEnabled) {
        speak(response);
      }
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const toggleVoiceInput = useCallback(() => {
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
        <h1 className="text-xl font-semibold gradient-text">AI Search</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={voiceEnabled ? "text-primary" : "text-muted-foreground"}
        >
          {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        {/* Search bar - Google-like when no results */}
        <motion.div
          className={`w-full max-w-2xl transition-all duration-500 ${
            results.length === 0 ? "flex-1 flex flex-col items-center justify-center" : "mb-8"
          }`}
          layout
        >
          {results.length === 0 && (
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ask <span className="gradient-text">Anything</span>
              </h2>
              <p className="text-muted-foreground">
                Get intelligent, conversational answers powered by AI
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isListening ? "Listening..." : "Search anything..."}
                value={isListening ? transcript : query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isListening || isLoading}
                className="h-14 pl-12 pr-24 text-lg rounded-full glass border-border/50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleVoiceInput}
                  className={isListening ? "text-red-500 animate-pulse" : ""}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!query.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        <div className="w-full max-w-2xl space-y-6">
          <AnimatePresence>
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6"
              >
                <p className="text-sm text-muted-foreground mb-2">You asked:</p>
                <p className="font-medium mb-4">{result.query}</p>
                <div className="border-t border-border/50 pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Answer:</p>
                  <p className="whitespace-pre-wrap">{result.response}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Current streaming response */}
          {isLoading && currentResponse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-6"
            >
              <p className="whitespace-pre-wrap">{currentResponse}</p>
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
            </motion.div>
          )}

          {/* Loading indicator */}
          {isLoading && !currentResponse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-8"
            >
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Thinking...</span>
            </motion.div>
          )}

          <div ref={resultsEndRef} />
        </div>
      </main>
    </div>
  );
};

export default AISearch;
