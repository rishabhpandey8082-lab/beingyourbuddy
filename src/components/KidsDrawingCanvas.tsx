import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, Palette, RotateCcw, Sparkles, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNaturalTTS } from "@/hooks/useNaturalTTS";
import { toast } from "sonner";

interface DrawingCanvasProps {
  onBack: () => void;
}

const colors = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3",
  "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA",
  "#FF9671", "#00C9A7", "#FFC75F", "#845EC2"
];

const stickers = ["⭐", "❤️", "🌈", "🌸", "🦋", "🌞", "🌙", "🎈", "🎀", "🌺", "🐱", "🐶", "🦄", "🎨"];

const KidsDrawingCanvas = ({ onBack }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#FF6B6B");
  const [brushSize, setBrushSize] = useState(8);
  const [showStickers, setShowStickers] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [placedStickers, setPlacedStickers] = useState<{ emoji: string; x: number; y: number }[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  const { speak } = useNaturalTTS();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPosition = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (selectedSticker) {
      const pos = getPosition(e);
      setPlacedStickers(prev => [...prev, { emoji: selectedSticker, x: pos.x, y: pos.y }]);
      speak("Nice!", "english");
      setSelectedSticker(null);
      return;
    }
    
    setIsDrawing(true);
    const pos = getPosition(e);
    setLastPos(pos);
  }, [getPosition, selectedSticker, speak]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || selectedSticker) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const pos = getPosition(e);
    
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    setLastPos(pos);
  }, [isDrawing, currentColor, brushSize, lastPos, getPosition, selectedSticker]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPlacedStickers([]);
    speak("Let's start fresh!", "english");
  }, [speak]);

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = "my-drawing.png";
    link.href = canvas.toDataURL();
    link.click();
    
    speak("Beautiful drawing saved!", "english");
    toast.success("🎨 Drawing saved!");
  }, [speak]);

  const praise = useCallback(() => {
    const praises = [
      "Beautiful!", "I love it!", "So creative!", "Amazing work!",
      "You're an artist!", "Wonderful colors!", "Keep going!"
    ];
    const random = praises[Math.floor(Math.random() * praises.length)];
    speak(random, "english");
    toast.success(`✨ ${random}`);
  }, [speak]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #FFF9E6 0%, #FFE4F3 100%)" }}>
      <header className="p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white/50"
          onClick={onBack}
        >
          <span className="text-2xl">←</span>
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 shadow">
          <Palette className="w-5 h-5 text-pink-500" />
          <span className="text-lg font-bold text-gray-700">Draw & Create</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/50"
          onClick={praise}
        >
          <Sparkles className="w-5 h-5 text-yellow-500" />
        </Button>
      </header>

      {/* Canvas area */}
      <main className="flex-1 px-4 pb-4 relative">
        <div className="relative w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ cursor: selectedSticker ? "copy" : "crosshair" }}
          />
          
          {/* Placed stickers overlay */}
          {placedStickers.map((sticker, index) => (
            <motion.span
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute text-4xl pointer-events-none"
              style={{ left: sticker.x - 20, top: sticker.y - 20 }}
            >
              {sticker.emoji}
            </motion.span>
          ))}
        </div>
      </main>

      {/* Tools */}
      <div className="p-4 flex items-center justify-center gap-3">
        {/* Color picker */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setShowColors(!showColors); setShowStickers(false); }}
          className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center"
          style={{ background: currentColor }}
        >
          <Palette className="w-6 h-6 text-white drop-shadow" />
        </motion.button>

        {/* Brush size */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setBrushSize(prev => prev === 8 ? 16 : prev === 16 ? 24 : 8)}
          className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center"
        >
          <div 
            className="rounded-full bg-gray-700"
            style={{ width: brushSize, height: brushSize }}
          />
        </motion.button>

        {/* Stickers */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setShowStickers(!showStickers); setShowColors(false); }}
          className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center ${showStickers ? "bg-pink-400" : "bg-white"}`}
        >
          <Star className={`w-6 h-6 ${showStickers ? "text-white" : "text-pink-500"}`} />
        </motion.button>

        {/* Eraser */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentColor("#FFFFFF")}
          className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center ${currentColor === "#FFFFFF" ? "bg-gray-300" : "bg-white"}`}
        >
          <Eraser className="w-6 h-6 text-gray-600" />
        </motion.button>

        {/* Clear */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={clearCanvas}
          className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center"
        >
          <RotateCcw className="w-6 h-6 text-red-400" />
        </motion.button>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={saveDrawing}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg flex items-center justify-center"
        >
          <Download className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Color picker popup */}
      <AnimatePresence>
        {showColors && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-32 left-4 right-4 p-4 bg-white rounded-3xl shadow-2xl"
          >
            <div className="grid grid-cols-6 gap-3">
              {colors.map(color => (
                <motion.button
                  key={color}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => { setCurrentColor(color); setShowColors(false); }}
                  className={`w-12 h-12 rounded-xl shadow-md ${currentColor === color ? "ring-4 ring-offset-2 ring-gray-400" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker picker popup */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-32 left-4 right-4 p-4 bg-white rounded-3xl shadow-2xl"
          >
            <div className="grid grid-cols-7 gap-3">
              {stickers.map(emoji => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => { 
                    setSelectedSticker(emoji); 
                    setShowStickers(false);
                    speak("Tap to place sticker!", "english");
                  }}
                  className="w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-2xl"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected sticker indicator */}
      <AnimatePresence>
        {selectedSticker && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2"
          >
            <span className="text-3xl">{selectedSticker}</span>
            <span className="text-gray-600 font-medium">Tap canvas to place!</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSticker(null)}
              className="ml-2"
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KidsDrawingCanvas;
