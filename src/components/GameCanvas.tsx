import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface GameCanvasProps {
  isFrozen: boolean;
  currentHint: string;
  isHintRevealed: boolean;
  images: string[];
  currentWord: string;
}

export default function GameCanvas({ isFrozen, currentHint, isHintRevealed, images, currentWord }: GameCanvasProps) {
  return (
    <div className="flex-1 relative flex flex-col items-center justify-center p-8 pt-12 pb-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      
      {/* Hint Banner - Centered but with clear space */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 mb-6 bg-white/5 backdrop-blur-md border border-white/10 px-8 py-4 rounded-2xl min-w-[300px] relative"
      >
        <p className="text-white/60 text-[10px] font-black tracking-[0.2em] uppercase text-center mb-1">
          PISTA DEL NIVEL
        </p>
        <div className="flex items-center justify-center min-h-[2rem]">
          {isHintRevealed ? (
            <motion.p 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-white text-lg font-bold text-center leading-tight"
            >
              {currentHint}
            </motion.p>
          ) : (
            <div className="flex items-center gap-2 text-pink-500/60">
              <span className="text-sm font-bold uppercase tracking-widest">Bloqueada</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Heart className="w-4 h-4 fill-current" />
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Image Grid - Constrained height to avoid overlapping UI */}
      <div className="grid grid-cols-2 gap-4 max-w-3xl w-full max-h-[50vh] relative z-10">
        {images.map((src, i) => (
          <motion.div
            key={`${currentWord}-${i}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              filter: isFrozen 
                ? `grayscale(1) brightness(1.5)` 
                : `none`
            }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group"
          >
            <img 
              src={src} 
              alt="Clue" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Fallback to a reliable image service if the original URL fails
                // Use the current word to ensure relevance
                const fallbackUrl = `https://loremflickr.com/800/600/${currentWord},clue?lock=${i}`;
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* Floating Particles/Effects can go here */}
      {isFrozen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none bg-blue-500/10 backdrop-grayscale"
        />
      )}
    </div>
  );
}
