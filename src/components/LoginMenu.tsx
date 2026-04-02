import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TikTokEvent } from '../types';
import { MessageSquare, Trophy, Zap, Play } from 'lucide-react';

interface LoginMenuProps {
  onLogin: (username: string) => void;
}

export default function LoginMenu({ onLogin }: LoginMenuProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-block p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/20"
          >
            <Zap className="w-8 h-8 text-white fill-current" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic mb-2">
            WORD WARRIORS
          </h1>
          <p className="text-white/50 text-sm font-medium uppercase tracking-widest">
            Edición TikTok Live
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
              Usuario de TikTok
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-white/30 font-bold">@</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95 group shadow-xl"
          >
            <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
            CONECTAR LIVE
          </button>
        </form>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
            <MessageSquare className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[10px] font-black text-white/40 uppercase">Chat</span>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
            <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <span className="text-[10px] font-black text-white/40 uppercase">Premios</span>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
            <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[10px] font-black text-white/40 uppercase">Velocidad</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
