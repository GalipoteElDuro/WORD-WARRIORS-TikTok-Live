import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Crown } from 'lucide-react';
import { useTikTokLive } from './hooks/useTikTokLive';
import Leaderboard from './components/Leaderboard';
import GameCanvas from './components/GameCanvas';
import StatusBanner from './components/StatusBanner';
import LoginMenu from './components/LoginMenu';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');

  const { 
    users, 
    currentWord, 
    levelNumber,
    likesCount,
    isHintRevealed,
    isFrozen, 
    revealedIndices,
    lastComment,
    lastWinner,
    isLoadingNext
  } = useTikTokLive(isLoggedIn);

  const prevWordRef = useRef(currentWord.word);

  useEffect(() => {
    if (isLoggedIn && prevWordRef.current !== currentWord.word) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706']
      });
      prevWordRef.current = currentWord.word;
    }
  }, [currentWord, isLoggedIn]);

  const handleLogin = (username: string) => {
    setTiktokUsername(username);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginMenu onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex bg-black relative overflow-hidden">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-4 z-50 pointer-events-none flex gap-2">
          <div className="px-4 py-2 rounded-xl backdrop-blur-xl border border-white/10 bg-white/5 text-white/50 flex items-center gap-2 shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest">Live:</span>
            <span className="text-xs font-bold text-white">@{tiktokUsername}</span>
          </div>
          <div className="px-4 py-2 rounded-xl backdrop-blur-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center gap-2 shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest">Nivel:</span>
            <span className="text-xs font-bold text-white">{levelNumber}</span>
          </div>
          
          <div className="px-4 py-2 rounded-xl backdrop-blur-xl border border-pink-500/30 bg-pink-500/10 text-pink-400 flex items-center gap-3 shadow-xl">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">Meta Pista</span>
              <div className="w-24 h-1.5 bg-pink-900/30 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((likesCount / 500) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold text-white">{likesCount}/500</span>
            </div>
          </div>
        </div>
        
        <StatusBanner />
        
        {/* AI Loading Overlay */}
        <AnimatePresence>
          {isLoadingNext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
              />
              <span className="text-white font-black tracking-[0.2em] uppercase text-xs animate-pulse">Generando Nivel Infinito...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winner Announcement Overlay */}
        <AnimatePresence>
          {lastWinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] flex flex-col items-center pointer-events-none"
            >
              <div className="bg-yellow-500/20 backdrop-blur-3xl border-2 border-yellow-500 p-8 rounded-[40px] shadow-[0_0_100px_rgba(234,179,8,0.3)] flex flex-col items-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mb-4"
                >
                  <Crown className="w-16 h-16 text-yellow-500 fill-current" />
                </motion.div>
                <span className="text-yellow-500 font-black tracking-[0.3em] uppercase text-xs mb-2">¡ACERTÓ LA PALABRA!</span>
                <div className="flex items-center gap-4">
                  {lastWinner.avatar && (
                    <img src={lastWinner.avatar} className="w-12 h-12 rounded-full border-2 border-yellow-500 shadow-lg" referrerPolicy="no-referrer" />
                  )}
                  <h2 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                    {lastWinner.username}
                  </h2>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GameCanvas 
          isFrozen={isFrozen} 
          currentHint={currentWord.hint}
          isHintRevealed={isHintRevealed}
          images={currentWord.images}
          currentWord={currentWord.word}
        />

        {/* Bottom UI */}
        <div className="p-8 flex items-end justify-center z-20 bg-gradient-to-t from-black via-black/80 to-transparent relative">
          {/* Current Word Display */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-white/40 text-[10px] font-black tracking-[0.4em] uppercase">Palabra Actual</span>
            <div className="flex gap-2">
              {currentWord.word.split('').map((char, i) => (
                <motion.div
                  key={`${currentWord.word}-${i}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-12 h-16 backdrop-blur-xl border rounded-xl flex items-center justify-center text-3xl font-black shadow-2xl transition-colors duration-500 ${
                    revealedIndices.includes(i) 
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' 
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  {revealedIndices.includes(i) ? char : '?'}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interaction Stats - Absolute positioned to the right */}
          <div className="absolute right-8 bottom-8 flex gap-6">
            <div className="flex flex-col items-center">
              <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/30 mb-2">
                <MessageSquare className="text-blue-500 fill-current" />
              </div>
              <span className="text-white font-black">{users.length}</span>
              <span className="text-white/40 text-[10px] uppercase font-bold">Jugadores</span>
            </div>
          </div>
        </div>

        {/* Floating Comments Overlay - Higher Z-Index and adjusted position */}
        <div className="absolute bottom-40 left-8 w-64 z-30 pointer-events-none">
          <AnimatePresence>
            {lastComment && (
              <motion.div
                key={Date.now()}
                initial={{ opacity: 0, y: 20, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -40, x: 20 }}
                className="bg-white/20 backdrop-blur-xl border border-white/30 p-3 rounded-2xl mb-2 flex items-center gap-3 shadow-2xl"
              >
                <div className="text-xs">
                  <span className="font-black text-white/80 block">{lastComment.username}</span>
                  <span className="text-white font-bold">{lastComment.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Leaderboard Sidebar */}
      <Leaderboard users={users} />

      {/* Winner Overlay */}
      <AnimatePresence>
        {users[0]?.score > 10000 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-center items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <Crown className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
              <h1 className="text-6xl font-black text-white mb-2 italic tracking-tighter">
                {users[0].username}
              </h1>
              <p className="text-yellow-500 text-2xl font-black tracking-widest">ES EL GUERRERO SUPREMO</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
