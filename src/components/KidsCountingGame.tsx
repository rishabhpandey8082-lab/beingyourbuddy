import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Star, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import { toast } from "sonner";

interface CountingGameProps {
  onBack: () => void;
}

interface Question {
  emoji: string;
  count: number;
  options: number[];
}

const countingEmojis = ["🍎", "⭐", "🌸", "🐱", "🎈", "🍪", "🌈", "🦋", "🍌", "🐶"];

const KidsCountingGame = ({ onBack }: CountingGameProps) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);

  const { speak } = useNaturalTTS();

  const generateQuestion = useCallback(() => {
    const emoji = countingEmojis[Math.floor(Math.random() * countingEmojis.length)];
    const count = Math.floor(Math.random() * 8) + 1; // 1-8 items
    
    // Generate wrong options
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 2) {
      const wrong = Math.max(1, count + Math.floor(Math.random() * 5) - 2);
      if (wrong !== count) {
        wrongOptions.add(wrong);
      }
    }
    
    const options = [count, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    
    setQuestion({ emoji, count, options });
    setSelectedAnswer(null);
    setShowResult(false);
    
    speak(`How many ${emoji} do you see?`, "english");
  }, [speak]);

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (answer: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    setTotalQuestions(prev => prev + 1);
    
    if (answer === question?.count) {
      setIsCorrect(true);
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      
      const praises = ["Great job!", "Awesome!", "You're so smart!", "Perfect!", "Amazing!"];
      const praise = praises[Math.floor(Math.random() * praises.length)];
      speak(praise, "english");
      toast.success(`🎉 ${praise}`);
    } else {
      setIsCorrect(false);
      setStreak(0);
      speak(`The answer is ${question?.count}. Try again!`, "english");
    }
    
    // Auto next question after delay
    setTimeout(() => {
      generateQuestion();
    }, 2000);
  };

  const speakQuestion = () => {
    if (question) {
      speak(`How many ${question.emoji} do you see?`, "english");
    }
  };

  if (!question) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #FFF3E0 0%, #E3F2FD 100%)" }}>
      <header className="p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white/50"
          onClick={onBack}
        >
          <span className="text-2xl">←</span>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 shadow">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-gray-700">{score}</span>
          </div>
          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 shadow"
            >
              <span className="text-lg">🔥</span>
              <span className="font-bold text-orange-600">{streak}</span>
            </motion.div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white/50"
          onClick={speakQuestion}
        >
          <Volume2 className="w-5 h-5 text-gray-600" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.h2
          key={question.emoji + question.count}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-gray-800 mb-6 text-center"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          How many {question.emoji} can you count?
        </motion.h2>

        {/* Items to count */}
        <motion.div
          key={`items-${question.emoji}-${question.count}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl mb-8 max-w-xs w-full"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {[...Array(question.count)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.1, type: "spring", bounce: 0.6 }}
                className="text-5xl"
              >
                {question.emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Answer options */}
        <div className="grid grid-cols-3 gap-4 max-w-xs w-full">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isAnswer = question.count === option;
            
            let buttonStyle = "bg-white";
            if (showResult && isSelected) {
              buttonStyle = isCorrect ? "bg-green-400" : "bg-red-400";
            } else if (showResult && isAnswer && !isCorrect) {
              buttonStyle = "bg-green-400";
            }
            
            return (
              <motion.button
                key={option}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={`aspect-square rounded-2xl shadow-lg flex items-center justify-center text-4xl font-bold transition-all ${buttonStyle} ${
                  !showResult ? "hover:bg-gray-50 active:bg-gray-100" : ""
                }`}
              >
                {option}
              </motion.button>
            );
          })}
        </div>

        {/* Result feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 px-6 py-3 rounded-full flex items-center gap-2 ${
                isCorrect ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isCorrect ? (
                <>
                  <Check className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-bold text-lg">Correct!</span>
                </>
              ) : (
                <>
                  <X className="w-6 h-6 text-red-600" />
                  <span className="text-red-700 font-bold text-lg">The answer is {question.count}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress */}
      <div className="p-4 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
          <span className="text-gray-600">Questions:</span>
          <span className="font-bold text-gray-800">{totalQuestions}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">Correct:</span>
          <span className="font-bold text-green-600">{Math.floor(score / 10)}</span>
        </div>
      </div>
    </div>
  );
};

export default KidsCountingGame;
