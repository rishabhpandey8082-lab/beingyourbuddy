import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Brain, Globe, Briefcase, Target, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-semibold">About Cognify</span>
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
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-glow"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              About <span className="gradient-text">Cognify</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From Curiosity to Confidence
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 glass-card rounded-3xl p-8 md:p-12">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Cognify is an AI-powered learning and communication platform designed to help people 
              think clearly, learn effectively, and speak with confidence.
            </p>

            <p className="text-lg leading-relaxed text-muted-foreground">
              We believe intelligence is not about memorizing answers — it's about understanding, 
              expression, and growth.
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
                Get Started with Cognify
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
