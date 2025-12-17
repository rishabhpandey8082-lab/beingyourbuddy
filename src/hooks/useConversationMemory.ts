import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
  emotionalTone?: string;
}

interface ConversationMemory {
  sessionId: string;
  conversationId: string | null;
  userName: string | null;
  messages: Message[];
  isLoading: boolean;
  setUserName: (name: string) => void;
  addMessage: (message: Message) => Promise<void>;
  getConversationContext: () => string;
  clearMemory: () => void;
}

// Get or create a session ID that persists across page reloads
const getSessionId = (): string => {
  let sessionId = localStorage.getItem("yourbuddy_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("yourbuddy_session_id", sessionId);
  }
  return sessionId;
};

export const useConversationMemory = (): ConversationMemory => {
  const [sessionId] = useState(getSessionId);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(() => {
    return localStorage.getItem("yourbuddy_user_name");
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        // Try to find existing conversation for this session
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id, user_name")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existingConv) {
          setConversationId(existingConv.id);
          if (existingConv.user_name) {
            setUserNameState(existingConv.user_name);
            localStorage.setItem("yourbuddy_user_name", existingConv.user_name);
          }

          // Load messages
          const { data: messagesData } = await supabase
            .from("messages")
            .select("role, content, emotional_tone")
            .eq("conversation_id", existingConv.id)
            .order("created_at", { ascending: true });

          if (messagesData) {
            setMessages(
              messagesData.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                emotionalTone: m.emotional_tone || undefined,
              }))
            );
          }
        } else {
          // Create new conversation
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({ session_id: sessionId, user_name: userName })
            .select("id")
            .single();

          if (newConv) {
            setConversationId(newConv.id);
          }
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [sessionId, userName]);

  const setUserName = useCallback(
    async (name: string) => {
      setUserNameState(name);
      localStorage.setItem("yourbuddy_user_name", name);

      if (conversationId) {
        await supabase
          .from("conversations")
          .update({ user_name: name })
          .eq("id", conversationId);
      }
    },
    [conversationId]
  );

  const addMessage = useCallback(
    async (message: Message) => {
      setMessages((prev) => [...prev, message]);

      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          emotional_tone: message.emotionalTone,
        });
      }
    },
    [conversationId]
  );

  const getConversationContext = useCallback(() => {
    // Extract key topics from recent messages
    const recentMessages = messages.slice(-10);
    const topics: string[] = [];

    for (const msg of recentMessages) {
      // Look for key phrases that might be worth remembering
      const content = msg.content.toLowerCase();
      if (content.includes("interview") || content.includes("job")) {
        topics.push("job/interview preparation");
      }
      if (content.includes("study") || content.includes("exam") || content.includes("test")) {
        topics.push("studying/exams");
      }
      if (content.includes("stressed") || content.includes("anxious")) {
        topics.push("feeling stressed");
      }
      if (content.includes("excited") || content.includes("happy")) {
        topics.push("positive mood");
      }
    }

    const uniqueTopics = [...new Set(topics)];
    return uniqueTopics.length > 0
      ? `Topics discussed: ${uniqueTopics.join(", ")}`
      : "";
  }, [messages]);

  const clearMemory = useCallback(async () => {
    setMessages([]);
    
    // Create a new conversation
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({ session_id: sessionId, user_name: userName })
      .select("id")
      .single();

    if (newConv) {
      setConversationId(newConv.id);
    }
  }, [sessionId, userName]);

  return {
    sessionId,
    conversationId,
    userName,
    messages,
    isLoading,
    setUserName,
    addMessage,
    getConversationContext,
    clearMemory,
  };
};
