import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Volume2, VolumeX, History, Sparkles, MessageSquare, Check, RotateCcw, Upload, FileText, Image, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useCleanSpeechRecognition } from "@/hooks/useCleanSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useAuth } from "@/contexts/AuthContext";
import ConversationHistory from "@/components/ConversationHistory";
import VoiceOrb from "@/components/VoiceOrb";
import ChatMessage from "@/components/ChatMessage";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { toast } from "sonner";

interface ChatItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  type: "pdf" | "image";
  content: string; // base64 or extracted text
  preview?: string;
}

const AISearch = () => {
  const [query, setQuery] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [pendingVoiceConfirm, setPendingVoiceConfirm] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { sendMessage, isLoading, currentResponse, clearHistory } = useChat();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, hasResult } = useCleanSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  // Update status
  useEffect(() => {
    if (isListening) setStatus("listening");
    else if (isLoading) setStatus("thinking");
    else if (isSpeaking || isTTSLoading) setStatus("speaking");
    else setStatus("idle");
  }, [isListening, isLoading, isSpeaking, isTTSLoading]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, currentResponse]);

  // Handle voice input completion - show confirmation
  useEffect(() => {
    if (!isListening && hasResult && transcript.trim()) {
      setPendingVoiceConfirm(transcript.trim());
    }
  }, [isListening, hasResult, transcript]);

  const handleSend = async (text: string, files?: UploadedFile[]) => {
    if (!text.trim() && (!files || files.length === 0)) return;

    // Build message content with file context
    let messageContent = text.trim();
    let conversationContext = "You are a helpful AI assistant. Provide clear, thoughtful answers. Be conversational but informative.";
    
    if (files && files.length > 0) {
      const fileDescriptions = files.map(f => {
        if (f.type === "pdf") {
          return `[PDF File: ${f.name}]\nContent: ${f.content.slice(0, 500)}${f.content.length > 500 ? "..." : ""}`;
        } else {
          return `[Image: ${f.name}] - User has uploaded an image. Describe what might be asked about it.`;
        }
      }).join("\n\n");
      
      conversationContext += `\n\nThe user has uploaded the following files:\n${fileDescriptions}\n\nAnswer questions based on these files.`;
    }

    const userMessage: ChatItem = {
      id: crypto.randomUUID(),
      role: "user",
      content: files && files.length > 0 ? `${messageContent}\n\n📎 ${files.map(f => f.name).join(", ")}` : messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setUploadedFiles([]); // Clear uploaded files after sending

    try {
      const response = await sendMessage(messageContent || "Please analyze the uploaded file(s)", "friend", {
        conversationContext,
      });

      const assistantMessage: ChatItem = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (voiceEnabled) {
        speak(response);
      }
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "image") => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        
        if (type === "pdf") {
          // For PDFs, we'll extract basic text (simplified for now)
          const newFile: UploadedFile = {
            id: crypto.randomUUID(),
            name: file.name,
            type: "pdf",
            content: `PDF document: ${file.name}. Size: ${(file.size / 1024).toFixed(1)}KB. User uploaded this for analysis.`,
          };
          setUploadedFiles((prev) => [...prev, newFile]);
          toast.success(`Added ${file.name}`);
        } else {
          // For images, store the base64
          const newFile: UploadedFile = {
            id: crypto.randomUUID(),
            name: file.name,
            type: "image",
            content: `Image: ${file.name}`,
            preview: result,
          };
          setUploadedFiles((prev) => [...prev, newFile]);
          toast.success(`Added ${file.name}`);
        }
      };
      
      if (type === "image") {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    
    setShowUploadMenu(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(query, uploadedFiles.length > 0 ? uploadedFiles : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(query, uploadedFiles.length > 0 ? uploadedFiles : undefined);
    }
  };

  const handleSelectConversation = (conversationId: string, loadedMessages: any[]) => {
    const formattedMessages: ChatItem[] = loadedMessages.map((msg) => ({
      id: crypto.randomUUID(),
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date(msg.created_at || Date.now()),
    }));
    setMessages(formattedMessages);
    toast.success("Conversation loaded");
  };

  const toggleVoice = useCallback(() => {
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
      handleSend(pendingVoiceConfirm);
      setPendingVoiceConfirm(null);
      resetTranscript();
    }
  };

  const retryVoiceInput = () => {
    setPendingVoiceConfirm(null);
    resetTranscript();
    startListening();
  };

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    clearHistory();
    setPendingVoiceConfirm(null);
    toast.success("New conversation started");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConversationHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

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
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold">AI Assistant</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={startNewChat}
              title="New chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setHistoryOpen(true)}
                title="Chat history"
              >
                <History className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-xl ${voiceEnabled ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Mute responses" : "Enable voice responses"}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Welcome State */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-xl"
            >
              {/* Orb with glow */}
              <div className="relative mb-8">
                <div className="absolute inset-0 blur-3xl opacity-30 bg-primary rounded-full scale-150" />
                <VoiceOrb
                  status={status}
                  onClick={toggleVoice}
                  disabled={!isSupported}
                  size="lg"
                />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                How can I help you{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  today?
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground text-lg mb-8"
              >
                Speak or type to start a conversation
              </motion.p>

              {/* Voice visualization when listening */}
              {/* Voice confirmation dialog */}
              <AnimatePresence>
                {pendingVoiceConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6 p-4 rounded-2xl bg-muted/50 border border-border/50"
                  >
                    <p className="text-sm text-muted-foreground mb-2">I heard:</p>
                    <p className="text-base font-medium mb-4">"{pendingVoiceConfirm}"</p>
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

              <AnimatePresence>
                {status === "listening" && !pendingVoiceConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <WaveformVisualizer isActive={true} className="h-16" />
                    <p className="text-sm text-muted-foreground mt-4 text-center">Listening for one sentence...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status indicator */}
              <StatusIndicator status={status} className="justify-center" />
            </motion.div>
          </div>
        ) : (
          /* Chat View */
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
              <div className="max-w-3xl mx-auto space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                      onSpeak={() => handleSpeakMessage(msg.content)}
                    />
                  ))}
                </AnimatePresence>

                {/* Streaming response */}
                {isLoading && currentResponse && (
                  <ChatMessage
                    role="assistant"
                    content={currentResponse}
                    isStreaming
                  />
                )}

                {/* Loading indicator */}
                {isLoading && !currentResponse && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="glass-card rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Voice control floating */}
            <div className="flex flex-col items-center py-4">
              <VoiceOrb
                status={status}
                onClick={toggleVoice}
                disabled={!isSupported}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 border-t border-border/40 bg-background/80 backdrop-blur-xl p-4">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            multiple
            onChange={(e) => handleFileUpload(e, "pdf")}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => handleFileUpload(e, "image")}
          />

          {/* Uploaded files preview */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-3xl mx-auto mb-3"
              >
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50"
                    >
                      {file.type === "pdf" ? (
                        <FileText className="w-4 h-4 text-red-500" />
                      ) : file.preview ? (
                        <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Image className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-destructive/20 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              {/* Upload button */}
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-10 w-10"
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                {/* Upload menu dropdown */}
                <AnimatePresence>
                  {showUploadMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 left-0 p-2 rounded-xl bg-background border border-border shadow-lg min-w-[160px]"
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Upload PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <Image className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Upload Image</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={isListening ? "Listening..." : uploadedFiles.length > 0 ? "Ask about the uploaded file(s)..." : "Type a message or tap the orb to speak..."}
                  value={isListening ? transcript : query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isListening || isLoading}
                  className="min-h-[52px] max-h-[200px] pr-14 resize-none rounded-2xl bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!query.trim() && uploadedFiles.length === 0 && !isListening) || isLoading}
                  className="absolute right-2 bottom-2 rounded-xl h-9 w-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AISearch;
