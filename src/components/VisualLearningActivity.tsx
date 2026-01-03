import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Mic, Check, X, RotateCcw, Image, Eye, Ear } from "lucide-react";
import { Button } from "@/components/ui/button";

// Visual learning exercise types
type VisualExerciseType = "image_to_word" | "image_to_speech" | "listen_repeat" | "match_image" | "fill_visual";

interface VisualExercise {
  type: VisualExerciseType;
  instruction: string;
  imageUrl?: string;
  imageEmoji?: string;
  targetWord: string;
  targetPronunciation?: string;
  options?: string[];
  audioText?: string;
}

interface Props {
  language: string;
  level: string;
  onComplete: (isCorrect: boolean, answer: string) => void;
  onSpeak: (text: string) => void;
  onListen: () => void;
  isListening: boolean;
  transcript: string;
  isSpeaking: boolean;
}

// Sample visual exercises - in production, these would come from AI or a database
const getVisualExercises = (language: string, level: string): VisualExercise[] => {
  const exercises: Record<string, VisualExercise[]> = {
    german: [
      { type: "image_to_word", instruction: "What is this?", imageEmoji: "🍎", targetWord: "der Apfel", options: ["der Apfel", "die Birne", "die Orange", "die Banane"] },
      { type: "image_to_word", instruction: "What is this?", imageEmoji: "🏠", targetWord: "das Haus", options: ["das Haus", "die Wohnung", "der Garten", "die Tür"] },
      { type: "image_to_word", instruction: "What is this?", imageEmoji: "🚗", targetWord: "das Auto", options: ["das Auto", "der Bus", "das Fahrrad", "der Zug"] },
      { type: "image_to_speech", instruction: "Say the word for this picture", imageEmoji: "☀️", targetWord: "die Sonne", targetPronunciation: "dee ZON-neh" },
      { type: "image_to_speech", instruction: "Say the word for this picture", imageEmoji: "🌙", targetWord: "der Mond", targetPronunciation: "dehr MOHNT" },
      { type: "listen_repeat", instruction: "Listen and repeat", audioText: "Guten Morgen", targetWord: "Guten Morgen", targetPronunciation: "GOO-ten MOR-gen" },
      { type: "listen_repeat", instruction: "Listen and repeat", audioText: "Wie geht es dir?", targetWord: "Wie geht es dir?", targetPronunciation: "vee GAYT ess deer" },
      { type: "match_image", instruction: "Match the image with the correct word", imageEmoji: "🍞", targetWord: "das Brot", options: ["das Brot", "der Käse", "die Milch", "das Wasser"] },
    ],
    english: [
      { type: "image_to_word", instruction: "What is this?", imageEmoji: "🐕", targetWord: "dog", options: ["dog", "cat", "bird", "fish"] },
      { type: "image_to_word", instruction: "What is this?", imageEmoji: "📚", targetWord: "book", options: ["book", "pen", "paper", "desk"] },
      { type: "image_to_speech", instruction: "Say the word for this picture", imageEmoji: "🌺", targetWord: "flower", targetPronunciation: "FLOW-er" },
      { type: "listen_repeat", instruction: "Listen and repeat", audioText: "Hello, how are you?", targetWord: "Hello, how are you?", targetPronunciation: "heh-LOH how ar YOO" },
    ],
    spanish: [
      { type: "image_to_word", instruction: "¿Qué es esto?", imageEmoji: "🐱", targetWord: "el gato", options: ["el gato", "el perro", "el pájaro", "el pez"] },
      { type: "image_to_speech", instruction: "Di la palabra para esta imagen", imageEmoji: "🌮", targetWord: "el taco", targetPronunciation: "el TAH-koh" },
      { type: "listen_repeat", instruction: "Escucha y repite", audioText: "Buenos días", targetWord: "Buenos días", targetPronunciation: "BWEH-nohs DEE-ahs" },
    ],
    french: [
      { type: "image_to_word", instruction: "Qu'est-ce que c'est?", imageEmoji: "🥐", targetWord: "le croissant", options: ["le croissant", "le pain", "la baguette", "le gâteau"] },
      { type: "image_to_speech", instruction: "Dites le mot pour cette image", imageEmoji: "🗼", targetWord: "la tour", targetPronunciation: "lah TOOR" },
      { type: "listen_repeat", instruction: "Écoutez et répétez", audioText: "Bonjour, comment allez-vous?", targetWord: "Bonjour, comment allez-vous?", targetPronunciation: "bon-ZHOOR koh-MAHN ah-lay VOO" },
    ],
  };

  return exercises[language] || exercises.english;
};

export const VisualLearningActivity = ({
  language,
  level,
  onComplete,
  onSpeak,
  onListen,
  isListening,
  transcript,
  isSpeaking,
}: Props) => {
  const [currentExercise, setCurrentExercise] = useState<VisualExercise | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Get random exercise on mount
  useEffect(() => {
    const exercises = getVisualExercises(language, level);
    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
    setCurrentExercise(randomExercise);
    setSelectedOption(null);
    setShowResult(false);
    setHasPlayed(false);
  }, [language, level]);

  // Handle speech result for speaking exercises
  useEffect(() => {
    if (transcript && currentExercise && (currentExercise.type === "image_to_speech" || currentExercise.type === "listen_repeat")) {
      const normalizedTranscript = transcript.toLowerCase().trim();
      const normalizedTarget = currentExercise.targetWord.toLowerCase().trim();
      
      // Fuzzy match - allow partial matches
      const correct = normalizedTarget.includes(normalizedTranscript) || 
                     normalizedTranscript.includes(normalizedTarget) ||
                     normalizedTranscript.split(" ").some(word => normalizedTarget.includes(word));
      
      setIsCorrect(correct);
      setShowResult(true);
      
      setTimeout(() => {
        onComplete(correct, transcript);
      }, 2000);
    }
  }, [transcript, currentExercise, onComplete]);

  const handleOptionSelect = (option: string) => {
    if (showResult) return;
    
    setSelectedOption(option);
    const correct = option === currentExercise?.targetWord;
    setIsCorrect(correct);
    setShowResult(true);
    
    setTimeout(() => {
      onComplete(correct, option);
    }, 1500);
  };

  const playAudio = () => {
    if (currentExercise?.audioText) {
      onSpeak(currentExercise.audioText);
      setHasPlayed(true);
    } else if (currentExercise?.targetWord) {
      onSpeak(currentExercise.targetWord);
      setHasPlayed(true);
    }
  };

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading exercise...</div>
      </div>
    );
  }

  const renderExercise = () => {
    switch (currentExercise.type) {
      case "image_to_word":
      case "match_image":
        return (
          <div className="space-y-6">
            {/* Image Display */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-7xl shadow-lg">
                {currentExercise.imageEmoji}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{currentExercise.instruction}</span>
              </div>
            </motion.div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentExercise.options?.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showResult}
                  className={`p-4 rounded-2xl text-center font-medium transition-all ${
                    showResult && option === currentExercise.targetWord
                      ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600"
                      : showResult && option === selectedOption && !isCorrect
                      ? "bg-red-500/20 border-2 border-red-500 text-red-600"
                      : selectedOption === option
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-secondary/50 border-2 border-transparent hover:border-primary/50 hover:bg-secondary"
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case "image_to_speech":
        return (
          <div className="space-y-6">
            {/* Image Display */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-7xl shadow-lg">
                {currentExercise.imageEmoji}
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">{currentExercise.instruction}</span>
                </div>
                {currentExercise.targetPronunciation && (
                  <p className="text-xs text-muted-foreground italic">
                    Pronunciation: {currentExercise.targetPronunciation}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Listen to correct pronunciation */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={playAudio}
                disabled={isSpeaking}
                className="rounded-full gap-2"
              >
                <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`} />
                Hear it
              </Button>
            </div>

            {/* Speak button */}
            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onListen}
                disabled={showResult}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                    : "bg-primary hover:bg-primary/90 shadow-lg"
                }`}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.button>
            </div>
            
            {isListening && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                Listening... Speak now!
              </p>
            )}

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 rounded-xl bg-secondary/50"
              >
                <p className="text-sm text-muted-foreground mb-1">You said:</p>
                <p className="font-medium text-lg">{transcript}</p>
              </motion.div>
            )}
          </div>
        );

      case "listen_repeat":
        return (
          <div className="space-y-6">
            {/* Audio Exercise */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shadow-lg">
                <Ear className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">{currentExercise.instruction}</span>
                </div>
              </div>
            </motion.div>

            {/* Play button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={playAudio}
                disabled={isSpeaking}
                className={`rounded-full gap-2 px-8 ${hasPlayed ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              >
                <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`} />
                {hasPlayed ? "Play Again" : "Listen"}
              </Button>
            </div>

            {hasPlayed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-center text-sm text-muted-foreground">
                  Now repeat what you heard
                </p>
                
                {/* Speak button */}
                <div className="flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onListen}
                    disabled={showResult}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                        : "bg-primary hover:bg-primary/90 shadow-lg"
                    }`}
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </motion.button>
                </div>

                {currentExercise.targetPronunciation && (
                  <p className="text-center text-xs text-muted-foreground italic">
                    Hint: {currentExercise.targetPronunciation}
                  </p>
                )}
              </motion.div>
            )}

            {isListening && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                Listening... Speak now!
              </p>
            )}

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 rounded-xl bg-secondary/50"
              >
                <p className="text-sm text-muted-foreground mb-1">You said:</p>
                <p className="font-medium text-lg">{transcript}</p>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-card">
      {renderExercise()}

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-6 p-4 rounded-2xl text-center ${
              isCorrect
                ? "bg-emerald-500/20 border border-emerald-500/50"
                : "bg-red-500/20 border border-red-500/50"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCorrect ? (
                <Check className="w-6 h-6 text-emerald-500" />
              ) : (
                <X className="w-6 h-6 text-red-500" />
              )}
              <span className={`font-bold text-lg ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                {isCorrect ? "Excellent!" : "Not quite"}
              </span>
            </div>
            {!isCorrect && (
              <p className="text-sm text-muted-foreground">
                The correct answer is: <strong>{currentExercise.targetWord}</strong>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualLearningActivity;
