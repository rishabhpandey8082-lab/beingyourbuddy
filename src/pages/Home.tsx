import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Languages, Briefcase, User, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ConversationHistory from "@/components/ConversationHistory";
import { toast } from "sonner";

const features = [
  {
    id: "search",
    title: "AI Search",
    description: "Ask anything and get intelligent, conversational answers instantly.",
    icon: Search,
    path: "/search",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "language",
    title: "Learn a Language",
    description: "Practice speaking any language with a patient AI conversation partner.",
    icon: Languages,
    path: "/language",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "interview",
    title: "Interview Practice",
    description: "Simulate real interviews with an AI avatar and get instant feedback.",
    icon: Briefcase,
    path: "/interview",
    gradient: "from-orange-500 to-red-500",
  },
];

const Home = () => {
  const { user, signOut } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSelectConversation = (conversationId: string, messages: any[]) => {
    // For now, just show a toast - this would navigate to a chat view
    toast.success(`Loaded conversation with ${messages.length} messages`);
    // In a full implementation, you'd navigate to a chat view with the messages
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Conversation History Panel */}
      <ConversationHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold gradient-text">YourBuddy</h1>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              title="Chat History"
            >
              <History className="w-5 h-5" />
            </Button>
          )}
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          className="text-center max-w-3xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Your AI Companion for{" "}
            <span className="gradient-text">Everything</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Search, learn languages, and practice interviews with natural voice
            conversations. No friction, just real human-like interaction.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={feature.path}>
                <div className="glass rounded-2xl p-6 h-full hover:scale-[1.02] transition-transform cursor-pointer group">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust message */}
        <motion.p
          className="mt-16 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          YourBuddy — Calm, intelligent, and always here for you.
        </motion.p>
      </main>
    </div>
  );
};

export default Home;
