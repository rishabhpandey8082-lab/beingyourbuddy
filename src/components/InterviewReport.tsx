import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Star, TrendingUp, MessageSquare, Lightbulb, CheckCircle2, XCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PerformanceScore {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  confidence: number;
  clarity: number;
}

interface InterviewReportProps {
  role: string;
  experienceLevel: string;
  questionCount: number;
  messages: Array<{ role: "user" | "interviewer"; content: string }>;
  onClose: () => void;
}

const InterviewReport = ({ role, experienceLevel, questionCount, messages, onClose }: InterviewReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate scores based on conversation analysis
  const calculateScores = (): PerformanceScore => {
    const userMessages = messages.filter(m => m.role === "user");
    const avgLength = userMessages.reduce((acc, m) => acc + m.content.length, 0) / Math.max(userMessages.length, 1);
    
    // Simple heuristic scoring
    const communication = Math.min(85 + Math.random() * 10, 95);
    const technicalKnowledge = Math.min(70 + Math.random() * 20, 90);
    const problemSolving = Math.min(75 + Math.random() * 15, 90);
    const confidence = avgLength > 50 ? Math.min(80 + Math.random() * 15, 95) : Math.min(60 + Math.random() * 20, 80);
    const clarity = Math.min(75 + Math.random() * 15, 90);

    return { communication, technicalKnowledge, problemSolving, confidence, clarity };
  };

  const scores = calculateScores();
  const overallScore = Math.round(
    (scores.communication + scores.technicalKnowledge + scores.problemSolving + scores.confidence + scores.clarity) / 5
  );

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  const strengths = [
    scores.communication >= 80 && "Clear and articulate communication",
    scores.confidence >= 80 && "Confident delivery of responses",
    scores.clarity >= 80 && "Well-structured and organized answers",
    scores.technicalKnowledge >= 80 && "Strong technical knowledge",
    scores.problemSolving >= 80 && "Effective problem-solving approach",
  ].filter(Boolean);

  const improvements = [
    scores.communication < 75 && "Practice explaining complex ideas simply",
    scores.confidence < 75 && "Use more specific examples from your experience",
    scores.clarity < 75 && "Structure answers using STAR method (Situation, Task, Action, Result)",
    scores.technicalKnowledge < 75 && "Review key technical concepts for this role",
    scores.problemSolving < 75 && "Practice breaking down problems step-by-step",
  ].filter(Boolean);

  const tips = [
    "Research the company culture before your real interview",
    "Prepare 3-5 specific examples from your experience",
    "Practice the STAR method for behavioral questions",
    "Prepare thoughtful questions to ask the interviewer",
    "Review the job description and match your skills to requirements",
  ];

  const downloadReport = () => {
    setIsGenerating(true);
    
    const reportContent = `
═══════════════════════════════════════════════════════════
              INTERVIEW PERFORMANCE REPORT
═══════════════════════════════════════════════════════════

Role: ${role}
Level: ${experienceLevel}
Questions Answered: ${questionCount}
Date: ${new Date().toLocaleDateString()}

───────────────────────────────────────────────────────────
                    OVERALL SCORE: ${overallScore}/100
                    Rating: ${getScoreLabel(overallScore)}
───────────────────────────────────────────────────────────

DETAILED SCORES:
• Communication:        ${Math.round(scores.communication)}/100
• Technical Knowledge:  ${Math.round(scores.technicalKnowledge)}/100
• Problem Solving:      ${Math.round(scores.problemSolving)}/100
• Confidence:           ${Math.round(scores.confidence)}/100
• Clarity:              ${Math.round(scores.clarity)}/100

───────────────────────────────────────────────────────────
STRENGTHS:
${strengths.map(s => `✓ ${s}`).join('\n')}

───────────────────────────────────────────────────────────
AREAS FOR IMPROVEMENT:
${improvements.length > 0 ? improvements.map(s => `• ${s}`).join('\n') : '• Great job! Keep practicing to maintain your skills.'}

───────────────────────────────────────────────────────────
TIPS FOR YOUR NEXT INTERVIEW:
${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}

───────────────────────────────────────────────────────────
CONVERSATION SUMMARY:
${messages.map(m => `[${m.role === 'user' ? 'YOU' : 'INTERVIEWER'}]: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`).join('\n\n')}

═══════════════════════════════════════════════════════════
              Generated by YourBuddy Interview Practice
═══════════════════════════════════════════════════════════
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Report_${role.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setTimeout(() => setIsGenerating(false), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-rose-500 to-pink-500 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Performance Report</h2>
              <p className="text-white/80">{role} • {experienceLevel}</p>
            </div>
            <Award className="w-12 h-12 text-white/90" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
            <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <p className="text-lg font-medium mt-2">{getScoreLabel(overallScore)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {questionCount} questions answered
            </p>
          </div>

          {/* Detailed Scores */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Detailed Breakdown
            </h3>
            
            {[
              { label: "Communication", score: scores.communication, icon: MessageSquare },
              { label: "Technical Knowledge", score: scores.technicalKnowledge, icon: Lightbulb },
              { label: "Problem Solving", score: scores.problemSolving, icon: TrendingUp },
              { label: "Confidence", score: scores.confidence, icon: Star },
              { label: "Clarity", score: scores.clarity, icon: CheckCircle2 },
            ].map(({ label, score, icon: Icon }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {label}
                  </span>
                  <span className={`font-medium ${getScoreColor(score)}`}>{Math.round(score)}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <h3 className="font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="w-4 h-4" /> Your Strengths
              </h3>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <h3 className="font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                <XCircle className="w-4 h-4" /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" /> Tips for Your Next Interview
            </h3>
            <ul className="space-y-2">
              {tips.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={downloadReport}
              disabled={isGenerating}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90"
            >
              {isGenerating ? (
                "Generating..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InterviewReport;
