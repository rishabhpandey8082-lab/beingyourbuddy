import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, MessageSquare, Trash2, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  preview?: string;
}

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string, messages: any[]) => void;
}

const ConversationHistory = ({ isOpen, onClose, onSelectConversation }: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get conversations with their first message for preview
      const { data: convData, error } = await supabase
        .from("conversations")
        .select("id, created_at, updated_at, user_name")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get first message for each conversation as preview
      const conversationsWithPreviews = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("content, role")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true })
            .limit(1);

          return {
            ...conv,
            preview: messages?.[0]?.content?.substring(0, 60) + (messages?.[0]?.content?.length > 60 ? "..." : "") || "Empty conversation",
          };
        })
      );

      setConversations(conversationsWithPreviews);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversation history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("role, content, emotional_tone")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      onSelectConversation(conversationId, messages || []);
      onClose();
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load conversation");
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Delete messages first (due to foreign key)
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);

      // Then delete conversation
      await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] glass border-r border-border/50 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Chat History</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start chatting to see history here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conv.preview || "Conversation"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConversationHistory;
