import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  Languages, 
  Briefcase, 
  User, 
  LogOut, 
  History,
  Mic,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ConversationHistory from "@/components/ConversationHistory";
import { toast } from "sonner";

const features = [
  {
    id: "search",
    title: "AI Search",
    subtitle: "Smart Answers",
    description: "Ask questions, explore topics, and get smart answers using text or voice.",
    icon: MessageSquare,
    path: "/search",
    gradient: "from-cyan-400 via-teal-400 to-emerald-400",
    glowColor: "hsl(175 80% 50% / 0.3)",
    isPrimary: true,
  },
  {
    id: "language",
    title: "Learn Languages",
    subtitle: "Interactive Learning",
    description: "Practice speaking and learning languages step-by-step with interactive lessons.",
    icon: Globe,
    path: "/language",
    gradient: "from-violet-400 via-purple-400 to-fuchsia-400",
    glowColor: "hsl(270 80% 60% / 0.3)",
    isPrimary: false,
  },
  {
    id: "interview",
    title: "Interview Practice",
    subtitle: "Career Preparation",
    description: "Practice real interview questions and improve confidence with AI feedback.",
    icon: Briefcase,
    path: "/interview",
    gradient: "from-amber-400 via-orange-400 to-rose-400",
    glowColor: "hsl(25 90% 55% / 0.3)",
    isPrimary: false,
  },
];

const Home = () => {
  const { user, signOut } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSelectConversation = (conversationId: string, messages: any[]) => {
    toast.success(`Loaded conversation with ${messages.length} messages`);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Floating orbs for ambient effect */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />

      {/* Conversation History Panel */}
      <ConversationHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      {/* Header */}
      <motion.header 
        className="relative z-10 w-full p-6 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text">YourBuddy</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              title="Chat History"
              className="hover:bg-white/10"
            >
              <History className="w-5 h-5" />
            </Button>
          )}
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline glass-subtle px-3 py-1.5 rounded-full">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut}
                className="hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="btn-secondary">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          className="text-center max-w-4xl mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 glass-subtle px-4 py-2 rounded-full mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Powered by Advanced AI</span>
          </motion.div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
            Your AI Companion for{" "}
            <span className="hero-text">Everything</span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Search, learn languages, and practice interviews with natural 
            <span className="text-foreground font-medium"> voice conversations</span>. 
            No friction, just real human-like interaction.
          </p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link to="/search">
              <button className="btn-cta flex items-center gap-3 group">
                <Mic className="w-5 h-5" />
                <span>Start Speaking Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/search">
              <button className="btn-secondary flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Try Text Mode</span>
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.15 }}
            >
              <Link to={feature.path}>
                <div 
                  className={`${feature.isPrimary ? 'feature-card-primary' : 'feature-card'} h-full cursor-pointer group`}
                  style={{ 
                    '--hover-glow': feature.glowColor 
                  } as React.CSSProperties}
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 shadow-lg`}
                    style={{ boxShadow: `0 8px 30px ${feature.glowColor}` }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">
                      {feature.subtitle}
                    </span>
                    <h3 className="text-2xl font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium">Get Started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Primary badge */}
                  {feature.isPrimary && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        Popular
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust message */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-muted-foreground text-sm mb-2">
            Trusted by learners and professionals worldwide
          </p>
          <p className="text-lg font-display font-medium gradient-text">
            YourBuddy — Calm, intelligent, and always here for you.
          </p>
        </motion.div>
      </main>

      {/* Footer gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default Home;