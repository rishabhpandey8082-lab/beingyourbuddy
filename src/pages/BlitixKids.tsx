import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Star, Heart, Play, Volume2, Mic, RotateCcw,
  Palette, Shapes, Music2, BookOpen, Hand, Sparkles,
  CheckCircle, X, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import { useReliableSpeechRecognition } from "@/hooks/useReliableSpeechRecognition";
import { toast } from "sonner";

type AgeMode = "little" | "young" | null;
type ActivityType = "tap-learn" | "sounds" | "colors" | "words" | "speak" | "games" | "stories" | "drawing" | "counting" | "memory" | null;

interface LearningItem {
  emoji: string;
  word: string;
  sound?: string;
  category: string;
}

const learningItems: Record<string, LearningItem[]> = {
  animals: [
    { emoji: "🐶", word: "Dog", sound: "woof woof", category: "animals" },
    { emoji: "🐱", word: "Cat", sound: "meow meow", category: "animals" },
    { emoji: "🐮", word: "Cow", sound: "moo moo", category: "animals" },
    { emoji: "🐷", word: "Pig", sound: "oink oink", category: "animals" },
    { emoji: "🐔", word: "Chicken", sound: "cluck cluck", category: "animals" },
    { emoji: "🦁", word: "Lion", sound: "roar", category: "animals" },
    { emoji: "🐘", word: "Elephant", category: "animals" },
    { emoji: "🐒", word: "Monkey", category: "animals" },
  ],
  fruits: [
    { emoji: "🍎", word: "Apple", category: "fruits" },
    { emoji: "🍌", word: "Banana", category: "fruits" },
    { emoji: "🍊", word: "Orange", category: "fruits" },
    { emoji: "🍇", word: "Grapes", category: "fruits" },
    { emoji: "🍓", word: "Strawberry", category: "fruits" },
    { emoji: "🍉", word: "Watermelon", category: "fruits" },
  ],
  vehicles: [
    { emoji: "🚗", word: "Car", sound: "vroom vroom", category: "vehicles" },
    { emoji: "🚌", word: "Bus", sound: "beep beep", category: "vehicles" },
    { emoji: "🚂", word: "Train", sound: "choo choo", category: "vehicles" },
    { emoji: "✈️", word: "Airplane", sound: "whoosh", category: "vehicles" },
    { emoji: "🚀", word: "Rocket", category: "vehicles" },
    { emoji: "🚲", word: "Bicycle", category: "vehicles" },
  ],
  colors: [
    { emoji: "🔴", word: "Red", category: "colors" },
    { emoji: "🟠", word: "Orange", category: "colors" },
    { emoji: "🟡", word: "Yellow", category: "colors" },
    { emoji: "🟢", word: "Green", category: "colors" },
    { emoji: "🔵", word: "Blue", category: "colors" },
    { emoji: "🟣", word: "Purple", category: "colors" },
  ],
  shapes: [
    { emoji: "⭕", word: "Circle", category: "shapes" },
    { emoji: "⬜", word: "Square", category: "shapes" },
    { emoji: "🔺", word: "Triangle", category: "shapes" },
    { emoji: "💎", word: "Diamond", category: "shapes" },
    { emoji: "⭐", word: "Star", category: "shapes" },
    { emoji: "💙", word: "Heart", category: "shapes" },
  ],
};

const simpleStories = [
  {
    title: "The Hungry Cat",
    pages: [
      { text: "A little cat was hungry.", emoji: "🐱" },
      { text: "It found a bowl of milk.", emoji: "🥛" },
      { text: "The cat drank all the milk.", emoji: "😋" },
      { text: "Now the cat is happy!", emoji: "😺" },
    ],
    question: "What did the cat drink?",
    answer: "milk",
  },
  {
    title: "The Red Ball",
    pages: [
      { text: "A boy had a red ball.", emoji: "🔴" },
      { text: "He threw the ball high.", emoji: "⬆️" },
      { text: "The ball went over the fence.", emoji: "🏠" },
      { text: "His dog brought it back!", emoji: "🐕" },
    ],
    question: "What color was the ball?",
    answer: "red",
  },
];

const BlitixKids = () => {
  const [ageMode, setAgeMode] = useState<AgeMode>(null);
  const [activity, setActivity] = useState<ActivityType>(null);
  const [currentItem, setCurrentItem] = useState<LearningItem | null>(null);
  const [currentCategory, setCurrentCategory] = useState("animals");
  const [score, setScore] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyPage, setStoryPage] = useState(0);
  const [showParentGate, setShowParentGate] = useState(false);
  const [parentMathAnswer, setParentMathAnswer] = useState("");
  const [parentMathQuestion, setParentMathQuestion] = useState({ a: 0, b: 0 });
  
  const { speak, stop: stopSpeaking, isSpeaking } = useNaturalTTS();
  const { isListening, transcript, startListening, stopListening, resetTranscript, hasResult } = useReliableSpeechRecognition();

  // Generate parent gate math question
  const generateMathQuestion = () => {
    const a = Math.floor(Math.random() * 5) + 3;
    const b = Math.floor(Math.random() * 5) + 2;
    setParentMathQuestion({ a, b });
    setParentMathAnswer("");
  };

  // Handle speech result for speaking activity
  useEffect(() => {
    if (!isListening && hasResult && transcript.trim() && activity === "speak" && currentItem) {
      const spoken = transcript.toLowerCase().trim();
      const target = currentItem.word.toLowerCase();
      
      if (spoken.includes(target) || target.includes(spoken)) {
        setScore(prev => prev + 10);
        speak("Awesome! Great job!", "english");
        toast.success("🎉 Wonderful!", { duration: 2000 });
      } else {
        speak(`Good try! The word is ${currentItem.word}`, "english");
      }
      resetTranscript();
    }
  }, [isListening, hasResult, transcript, activity, currentItem, speak, resetTranscript]);

  const selectRandomItem = useCallback((category: string) => {
    const items = learningItems[category];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    setCurrentItem(randomItem);
    return randomItem;
  }, []);

  const handleItemTap = (item: LearningItem) => {
    setCurrentItem(item);
    
    // Speak the word slowly for little ones
    if (ageMode === "little") {
      speak(item.word, "english");
    } else {
      speak(`This is a ${item.word}`, "english");
    }
    
    setScore(prev => prev + 5);
  };

  const handleSpeakActivity = () => {
    if (!currentItem) {
      const item = selectRandomItem(currentCategory);
      speak(`Say: ${item.word}`, "english");
    } else {
      speak(`Say: ${currentItem.word}`, "english");
    }
    
    setTimeout(() => {
      resetTranscript();
      startListening();
    }, 1500);
  };

  const nextStoryPage = () => {
    const story = simpleStories[storyIndex];
    if (storyPage < story.pages.length - 1) {
      setStoryPage(prev => prev + 1);
      speak(story.pages[storyPage + 1].text, "english");
    }
  };

  const prevStoryPage = () => {
    if (storyPage > 0) {
      setStoryPage(prev => prev - 1);
      speak(simpleStories[storyIndex].pages[storyPage - 1].text, "english");
    }
  };

  // Render Age Mode Selection
  if (!ageMode) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #FFF5E6 0%, #E8F5FF 50%, #F0FFF4 100%)" }}>
        <header className="p-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/50">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => {
              generateMathQuestion();
              setShowParentGate(true);
            }}
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-32 h-32 mb-8 rounded-full bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 flex items-center justify-center shadow-2xl"
          >
            <Star className="w-16 h-16 text-white" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
            Blitix Kids
          </h1>
          <p className="text-xl text-gray-600 mb-12 text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
            Learn • Play • Grow
          </p>

          <div className="grid gap-6 w-full max-w-md">
            {/* Little Explorers (2.5-4) */}
            <motion.button
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => setAgeMode("little")}
              className="p-6 rounded-3xl bg-gradient-to-r from-pink-100 to-purple-100 border-4 border-pink-200 shadow-lg hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                  <span className="text-4xl">🧸</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
                    Little Explorers
                  </h2>
                  <p className="text-lg text-gray-600">Ages 2.5 – 4</p>
                  <p className="text-sm text-gray-500 mt-1">Tap, Listen & Learn</p>
                </div>
              </div>
            </motion.button>

            {/* Young Learners (5-9) */}
            <motion.button
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setAgeMode("young")}
              className="p-6 rounded-3xl bg-gradient-to-r from-blue-100 to-cyan-100 border-4 border-blue-200 shadow-lg hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <span className="text-4xl">🚀</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
                    Young Learners
                  </h2>
                  <p className="text-lg text-gray-600">Ages 5 – 9</p>
                  <p className="text-sm text-gray-500 mt-1">Words, Games & Stories</p>
                </div>
              </div>
            </motion.button>
          </div>
        </main>

        {/* Parent Gate Modal */}
        <AnimatePresence>
          {showParentGate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Parent Check</h3>
                <p className="text-gray-600 mb-6 text-center">
                  What is {parentMathQuestion.a} + {parentMathQuestion.b}?
                </p>
                <input
                  type="number"
                  value={parentMathAnswer}
                  onChange={(e) => setParentMathAnswer(e.target.value)}
                  className="w-full p-4 text-2xl text-center border-2 border-gray-200 rounded-xl mb-4"
                  placeholder="?"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowParentGate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500"
                    onClick={() => {
                      if (parseInt(parentMathAnswer) === parentMathQuestion.a + parentMathQuestion.b) {
                        setShowParentGate(false);
                        toast.success("Parent access granted");
                      } else {
                        toast.error("Incorrect answer");
                        generateMathQuestion();
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render Activity Selection
  if (!activity) {
    const activities = ageMode === "little" 
      ? [
          { id: "tap-learn" as ActivityType, name: "Tap & Learn", emoji: "👆", color: "from-yellow-400 to-orange-400", desc: "Tap pictures to learn" },
          { id: "sounds" as ActivityType, name: "Sound Match", emoji: "🔊", color: "from-green-400 to-emerald-400", desc: "Match sounds to pictures" },
          { id: "colors" as ActivityType, name: "Colors & Shapes", emoji: "🎨", color: "from-pink-400 to-rose-400", desc: "Learn colors and shapes" },
        ]
      : [
          { id: "words" as ActivityType, name: "Picture Words", emoji: "📚", color: "from-blue-400 to-indigo-400", desc: "Learn words with pictures" },
          { id: "speak" as ActivityType, name: "Speak & Repeat", emoji: "🎤", color: "from-purple-400 to-violet-400", desc: "Practice speaking" },
          { id: "games" as ActivityType, name: "Mini Games", emoji: "🎮", color: "from-cyan-400 to-teal-400", desc: "Fun learning games" },
          { id: "stories" as ActivityType, name: "Story Time", emoji: "📖", color: "from-amber-400 to-yellow-400", desc: "Read simple stories" },
          { id: "drawing" as ActivityType, name: "Draw & Create", emoji: "🎨", color: "from-pink-400 to-rose-400", desc: "Drawing with stickers" },
          { id: "counting" as ActivityType, name: "Counting Fun", emoji: "🔢", color: "from-green-400 to-emerald-400", desc: "Learn to count" },
          { id: "memory" as ActivityType, name: "Memory Match", emoji: "🧠", color: "from-indigo-400 to-purple-400", desc: "Match the pairs" },
        ];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: ageMode === "little" 
        ? "linear-gradient(135deg, #FFE4EC 0%, #FFF0F5 100%)" 
        : "linear-gradient(135deg, #E0F2FE 0%, #F0F9FF 100%)" 
      }}>
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => setAgeMode(null)}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold text-gray-700">{score}</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center px-6 py-8">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-gray-800 mb-2 text-center"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {ageMode === "little" ? "🧸 Little Explorers" : "🚀 Young Learners"}
          </motion.h2>
          <p className="text-lg text-gray-600 mb-8">Choose an activity!</p>

          <div className="grid gap-4 w-full max-w-md">
            {activities.map((act, index) => (
              <motion.button
                key={act.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", bounce: 0.4 }}
                onClick={() => {
                  setActivity(act.id);
                  if (act.id === "tap-learn" || act.id === "words") {
                    selectRandomItem(currentCategory);
                  }
                }}
                className="p-5 rounded-3xl bg-white/80 shadow-lg border-2 border-white hover:scale-105 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${act.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl">{act.emoji}</span>
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
                      {act.name}
                    </h3>
                    <p className="text-sm text-gray-500">{act.desc}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Render Tap & Learn Activity
  if (activity === "tap-learn" || activity === "words") {
    const categories = Object.keys(learningItems);
    const items = learningItems[currentCategory];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #FFF9E6 0%, #FFE4F3 100%)" }}>
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => setActivity(null)}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold text-gray-700">{score}</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col px-4 py-6">
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setCurrentCategory(cat);
                  selectRandomItem(cat);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-all ${
                  currentCategory === cat
                    ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg"
                    : "bg-white/70 text-gray-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Learning items grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            {items.map((item, index) => (
              <motion.button
                key={`${item.word}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
                onClick={() => handleItemTap(item)}
                className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 ${
                  currentItem?.word === item.word 
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400" 
                    : "bg-white/80"
                }`}
              >
                <span className="text-6xl">{item.emoji}</span>
                {activity === "words" && (
                  <span className="text-xl font-bold text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {item.word}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Current item feedback */}
          <AnimatePresence>
            {currentItem && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 p-6 rounded-3xl bg-white shadow-2xl flex items-center gap-4"
              >
                <span className="text-5xl">{currentItem.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800">{currentItem.word}</h3>
                  {currentItem.sound && (
                    <p className="text-gray-500">{currentItem.sound}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-blue-400 to-purple-400 w-14 h-14"
                  onClick={() => speak(currentItem.word, "english")}
                >
                  <Volume2 className="w-6 h-6 text-white" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Render Speak & Repeat Activity
  if (activity === "speak") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #F0E6FF 0%, #E6F0FF 100%)" }}>
        <header className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => setActivity(null)}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold text-gray-700">{score}</span>
          </div>
        </header>

        <main className="flex flex-col items-center px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-40 h-40 rounded-full bg-white shadow-2xl flex items-center justify-center mb-8"
          >
            <span className="text-8xl">{currentItem?.emoji || "🎤"}</span>
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
            {currentItem ? `Say: "${currentItem.word}"` : "Ready to speak?"}
          </h2>
          
          <p className="text-lg text-gray-500 mb-8">
            {isListening ? "🎤 Listening..." : "Tap the button and speak!"}
          </p>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSpeakActivity}
              disabled={isListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                isListening 
                  ? "bg-gradient-to-br from-red-400 to-pink-500 animate-pulse" 
                  : "bg-gradient-to-br from-purple-400 to-indigo-500"
              }`}
            >
              <Mic className="w-10 h-10 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const newItem = selectRandomItem(currentCategory);
                speak(`Say: ${newItem.word}`, "english");
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-2xl"
            >
              <RotateCcw className="w-10 h-10 text-white" />
            </motion.button>
          </div>

          {transcript && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-xl text-gray-600 bg-white/80 px-6 py-3 rounded-full"
            >
              You said: "{transcript}"
            </motion.p>
          )}
        </main>
      </div>
    );
  }

  // Render Story Time Activity
  if (activity === "stories") {
    const story = simpleStories[storyIndex];
    const page = story.pages[storyPage];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #FFF8E1 0%, #FFE0B2 100%)" }}>
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => {
              setActivity(null);
              setStoryPage(0);
            }}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h2 className="text-xl font-bold text-gray-800">{story.title}</h2>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            key={storyPage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center"
          >
            <span className="text-8xl mb-6 block">{page.emoji}</span>
            <p className="text-2xl text-gray-800 leading-relaxed" style={{ fontFamily: "Nunito, sans-serif" }}>
              {page.text}
            </p>
          </motion.div>

          <div className="flex gap-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={prevStoryPage}
              disabled={storyPage === 0}
            >
              ← Back
            </Button>
            <Button
              size="lg"
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
              onClick={() => speak(page.text, "english")}
            >
              <Volume2 className="w-5 h-5 mr-2" /> Read
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={nextStoryPage}
              disabled={storyPage === story.pages.length - 1}
            >
              Next →
            </Button>
          </div>

          <p className="mt-6 text-gray-500">
            Page {storyPage + 1} of {story.pages.length}
          </p>
        </main>
      </div>
    );
  }

  // Render Colors & Shapes / Games
  if (activity === "colors" || activity === "games") {
    const items = activity === "colors" 
      ? [...learningItems.colors, ...learningItems.shapes]
      : [...learningItems.animals, ...learningItems.fruits];

    const [gameItems, setGameItems] = useState<LearningItem[]>([]);
    const [targetItem, setTargetItem] = useState<LearningItem | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    useEffect(() => {
      startNewRound();
    }, []);

    const startNewRound = () => {
      const shuffled = [...items].sort(() => Math.random() - 0.5).slice(0, 4);
      setGameItems(shuffled);
      setTargetItem(shuffled[Math.floor(Math.random() * shuffled.length)]);
      setIsCorrect(null);
    };

    const handleGameTap = (item: LearningItem) => {
      if (item.word === targetItem?.word) {
        setIsCorrect(true);
        setScore(prev => prev + 10);
        speak("Great job!", "english");
        setTimeout(startNewRound, 1500);
      } else {
        setIsCorrect(false);
        speak(`That's ${item.word}. Try again!`, "english");
      }
    };

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)" }}>
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => setActivity(null)}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold text-gray-700">{score}</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
            Find the {targetItem?.word}!
          </h2>
          
          <Button
            variant="outline"
            className="mb-8 rounded-full"
            onClick={() => speak(`Find the ${targetItem?.word}`, "english")}
          >
            <Volume2 className="w-4 h-4 mr-2" /> Listen
          </Button>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {gameItems.map((item, index) => (
              <motion.button
                key={`${item.word}-${index}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGameTap(item)}
                className={`aspect-square rounded-3xl flex items-center justify-center text-7xl bg-white shadow-lg transition-all ${
                  isCorrect === true && item.word === targetItem?.word
                    ? "ring-4 ring-green-400 bg-green-50"
                    : isCorrect === false && item.word === targetItem?.word
                    ? "ring-4 ring-yellow-400"
                    : ""
                }`}
              >
                {item.emoji}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {isCorrect === true && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="fixed inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="text-9xl">🎉</div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Render Sound Matching
  if (activity === "sounds") {
    const soundItems = learningItems.animals.filter(item => item.sound);
    const [options, setOptions] = useState<LearningItem[]>([]);
    const [target, setTarget] = useState<LearningItem | null>(null);

    useEffect(() => {
      const shuffled = [...soundItems].sort(() => Math.random() - 0.5).slice(0, 3);
      setOptions(shuffled);
      setTarget(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }, []);

    const playSound = () => {
      if (target?.sound) {
        speak(target.sound, "english");
      }
    };

    const handleSoundTap = (item: LearningItem) => {
      if (item.word === target?.word) {
        setScore(prev => prev + 10);
        speak(`Yes! It's a ${item.word}!`, "english");
        toast.success("🎉 Correct!", { duration: 2000 });
        
        // New round
        setTimeout(() => {
          const shuffled = [...soundItems].sort(() => Math.random() - 0.5).slice(0, 3);
          setOptions(shuffled);
          setTarget(shuffled[Math.floor(Math.random() * shuffled.length)]);
        }, 1500);
      } else {
        speak(`That's a ${item.word}. Try again!`, "english");
      }
    };

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)" }}>
        <header className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/50"
            onClick={() => setActivity(null)}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold text-gray-700">{score}</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: "Nunito, sans-serif" }}>
            What makes this sound?
          </h2>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={playSound}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl mb-10"
          >
            <Volume2 className="w-16 h-16 text-white" />
          </motion.button>

          <div className="flex gap-4">
            {options.map((item, index) => (
              <motion.button
                key={`${item.word}-${index}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSoundTap(item)}
                className="w-28 h-28 rounded-3xl bg-white shadow-lg flex items-center justify-center text-6xl"
              >
                {item.emoji}
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default BlitixKids;
