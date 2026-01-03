import { motion } from "framer-motion";
import { Check, Circle, User, Brain, Briefcase, MessageSquare, Award } from "lucide-react";

interface InterviewStage {
  id: string;
  name: string;
  icon: any;
  description: string;
}

const stages: InterviewStage[] = [
  { id: "intro", name: "Introduction", icon: User, description: "Tell me about yourself" },
  { id: "hr", name: "HR Round", icon: MessageSquare, description: "Behavioral & culture fit" },
  { id: "technical", name: "Technical Round", icon: Brain, description: "Skills & problem-solving" },
  { id: "situational", name: "Situational", icon: Briefcase, description: "Case-based questions" },
  { id: "feedback", name: "Final Feedback", icon: Award, description: "Overall assessment" },
];

interface Props {
  currentStage: string;
  questionCount: number;
}

export const InterviewStages = ({ currentStage, questionCount }: Props) => {
  // Determine stage based on question count
  const getStageFromCount = (count: number): string => {
    if (count <= 1) return "intro";
    if (count <= 3) return "hr";
    if (count <= 5) return "technical";
    if (count <= 7) return "situational";
    return "feedback";
  };

  const activeStage = currentStage || getStageFromCount(questionCount);

  return (
    <div className="w-full px-4 py-3 glass-card rounded-2xl">
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const stageIndex = stages.findIndex(s => s.id === activeStage);
          const isCompleted = index < stageIndex;
          const isCurrent = stage.id === activeStage;
          const isPending = index > stageIndex;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted 
                      ? "hsl(var(--success))" 
                      : isCurrent 
                      ? "hsl(var(--primary))" 
                      : "hsl(var(--muted))",
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isCurrent ? "text-white" : "text-muted-foreground"}`} />
                  )}
                </motion.div>
                <span className={`text-xs mt-1.5 text-center hidden sm:block ${
                  isCurrent ? "font-medium text-primary" : "text-muted-foreground"
                }`}>
                  {stage.name}
                </span>
              </div>
              
              {index < stages.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                  isCompleted ? "bg-success" : "bg-muted"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const getInterviewStagePrompt = (questionCount: number, jdAnalysis: any): string => {
  const role = jdAnalysis?.role || "this position";
  const skills = jdAnalysis?.skills?.join(", ") || "relevant skills";
  
  if (questionCount <= 1) {
    return `STAGE: Introduction
Ask the candidate to introduce themselves and explain their interest in ${role}.
Keep it warm and welcoming. Set a professional but friendly tone.`;
  }
  
  if (questionCount <= 3) {
    return `STAGE: HR Round
Ask behavioral questions. Examples:
- Tell me about a challenge you overcame
- Describe a time you worked in a team
- How do you handle stress/deadlines?
Focus on soft skills, teamwork, communication.`;
  }
  
  if (questionCount <= 5) {
    return `STAGE: Technical Round
Ask about technical skills: ${skills}
- Specific experience with required technologies
- Problem-solving approach
- Past projects using these skills
Match difficulty to ${jdAnalysis?.experienceLevel || "mid"} level.`;
  }
  
  if (questionCount <= 7) {
    return `STAGE: Situational Questions
Ask case-based or scenario questions:
- "What would you do if..."
- "How would you handle..."
- Real-world problem scenarios
Related to ${role} responsibilities.`;
  }
  
  return `STAGE: Wrap Up
Provide final feedback:
1. What went well (be specific)
2. Areas to improve
3. Tips for the real interview
4. Overall assessment and encouragement
End on a positive, confidence-building note.`;
};

export default InterviewStages;
