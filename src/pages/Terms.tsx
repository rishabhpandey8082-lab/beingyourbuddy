import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertCircle, CheckCircle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Terms = () => {
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
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-semibold">Terms of Use</span>
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
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-glow"
            >
              <Scale className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Terms of Use
            </h1>
            <p className="text-xl text-muted-foreground">
              Please read these terms carefully
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 glass-card rounded-3xl p-8 md:p-12">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Agreement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By using Cognify, you agree to use the platform responsibly and in 
                  accordance with these terms.
                </p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Prohibited Activities</h2>
                  <p className="text-muted-foreground mb-4">You agree not to:</p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <span>Misuse the service in any way</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <span>Attempt unauthorized access to any part of the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <span>Use Cognify for harmful or illegal activities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cognify provides AI-generated responses intended for learning and practice 
                    purposes. We do not guarantee outcomes related to exams, jobs, or certifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8">
              <p className="text-muted-foreground text-center">
                We reserve the right to update features and policies to improve the platform.
              </p>
            </div>
          </div>

          {/* Back link */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/">
              <Button variant="outline" className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
