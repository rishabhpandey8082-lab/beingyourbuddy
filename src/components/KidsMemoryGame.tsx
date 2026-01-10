import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import { toast } from "sonner";

interface MemoryGameProps {
  onBack: () => void;
  difficulty?: "easy" | "medium";
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const emojiSets = {
  easy: ["🐶", "🐱", "🐰", "🐻", "🦊", "🐸"],
  medium: ["🍎", "🍌", "🍇", "🍓", "🍊", "🍉", "🍑", "🥝"]
};

const KidsMemoryGame = ({ onBack, difficulty = "easy" }: MemoryGameProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [stars, setStars] = useState(0);

  const { speak } = useNaturalTTS();

  // Initialize game
  const initGame = useCallback(() => {
    const emojis = emojiSets[difficulty];
    const pairs = [...emojis, ...emojis];
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffled.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    })));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsComplete(false);
    setStars(0);
    
    speak("Find matching pairs!", "english");
  }, [difficulty, speak]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check for match
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsLocked(true);
      const [first, second] = flippedCards;
      
      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === first || i === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            const totalPairs = emojiSets[difficulty].length;
            
            if (newMatches === totalPairs) {
              setIsComplete(true);
              const calculatedStars = moves <= totalPairs * 2 ? 3 : moves <= totalPairs * 3 ? 2 : 1;
              setStars(calculatedStars);
              speak("You won! Amazing!", "english");
              toast.success("🏆 Congratulations!");
            } else {
              speak("Great match!", "english");
            }
            return newMatches;
          });
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === first || i === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
      
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards, difficulty, moves, speak]);

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedCards.length >= 2) return;
    
    setCards(prev => prev.map((card, i) => 
      i === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedCards(prev => [...prev, index]);
  };

  const gridCols = difficulty === "easy" ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E0F7FA 0%, #E8F5E9 100%)" }}>
      <header className="p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white/50"
          onClick={onBack}
        >
          <span className="text-2xl">←</span>
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 shadow">
            <span className="text-lg">🎯</span>
            <span className="font-bold text-gray-700">{matches}/{emojiSets[difficulty].length}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 shadow">
            <span className="text-lg">👆</span>
            <span className="font-bold text-gray-700">{moves}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white/50"
          onClick={initGame}
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-gray-800 mb-6"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          🧠 Memory Match
        </motion.h2>

        <div className={`grid ${gridCols} gap-3 max-w-sm w-full`}>
          {cards.map((card, index) => (
            <motion.button
              key={card.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(index)}
              className={`aspect-square rounded-2xl shadow-lg flex items-center justify-center text-4xl transition-all duration-300 ${
                card.isFlipped || card.isMatched
                  ? "bg-white"
                  : "bg-gradient-to-br from-purple-400 to-pink-400"
              } ${card.isMatched ? "opacity-50" : ""}`}
              style={{
                transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
                transformStyle: "preserve-3d"
              }}
            >
              {(card.isFlipped || card.isMatched) ? (
                <span>{card.emoji}</span>
              ) : (
                <span className="text-white text-2xl">❓</span>
              )}
            </motion.button>
          ))}
        </div>
      </main>

      {/* Win modal */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl"
            >
              <motion.div
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", bounce: 0.6 }}
              >
                <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
              </motion.div>
              
              <h3 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
                You Won! 🎉
              </h3>
              
              <p className="text-gray-600 mb-4">
                Completed in {moves} moves!
              </p>
              
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                  >
                    <Star
                      className={`w-10 h-10 ${i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  </motion.div>
                ))}
              </div>
              
              <Button
                onClick={initGame}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-lg py-6"
              >
                Play Again! 🎮
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KidsMemoryGame;
