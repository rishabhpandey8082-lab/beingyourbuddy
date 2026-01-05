import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Globe, Briefcase, Target, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import blitixLogo from "@/assets/blitix-logo.png";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Floating orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <img src={blitixLogo} alt="Blitix" className="h-8 w-auto" />
          <span className="text-lg font-display font-semibold">About</span>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12">
        <motion.div
          className="max-w-3xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-glow overflow-hidden"
            >
              <img src={blitixLogo} alt="Blitix" className="w-20 h-20 object-contain" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              About <span className="gradient-text">Blitix</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Think Faster. Learn Smarter.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 glass-card rounded-3xl p-8 md:p-12">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Blitix is an intelligent AI platform for smart search, language learning, 
              interview preparation, and kid-friendly education — all in one place.
            </p>

            <p className="text-lg leading-relaxed text-muted-foreground">
              We believe intelligence is not about memorizing answers — it's about understanding, 
              expression, and growth. Blitix helps you ask better questions, learn faster, and 
              speak with confidence.
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 py-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Intelligent AI Search</h3>
                <p className="text-sm text-muted-foreground">Smart answers to any question</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Language Learning</h3>
                <p className="text-sm text-muted-foreground">Interactive speaking practice</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Interview Preparation</h3>
                <p className="text-sm text-muted-foreground">Real interview practice</p>
              </div>
            </div>

            {/* Brand Personality */}
            <div className="border-t border-border/50 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-display font-semibold">Brand Personality</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Intelligent", "Fast", "Friendly", "Modern", "Trustworthy", "International"].map((trait) => (
                  <span key={trait} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Mission */}
            <div className="border-t border-border/50 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-display font-semibold">Our Mission</h2>
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground">
                To make learning and communication confidence-driven, accessible, and natural 
                for everyone — anywhere in the world.
              </p>
            </div>

            {/* Founder */}
            <div className="border-t border-border/50 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-display font-semibold">Founder</h2>
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Founded by <strong className="text-foreground">Rishabh Raj Pandey</strong>
              </p>
              <p className="text-muted-foreground mt-2">
                Built with the vision to turn curiosity into confidence through thoughtful 
                AI design and practical learning experiences.
              </p>
            </div>
          </div>

          {/* CTA */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-muted-foreground mb-4">Ready to start your journey?</p>
            <Link to="/">
              <Button className="btn-cta">
                Get Started with Blitix
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
