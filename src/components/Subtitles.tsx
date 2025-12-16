import { motion, AnimatePresence } from "framer-motion";

interface SubtitlesProps {
  text: string;
  isVisible: boolean;
}

const Subtitles = ({ text, isVisible }: SubtitlesProps) => {
  return (
    <AnimatePresence>
      {isVisible && text && (
        <motion.div
          className="max-w-2xl mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass rounded-2xl px-6 py-4 text-center">
            <motion.p
              className="text-foreground text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {text}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Subtitles;
