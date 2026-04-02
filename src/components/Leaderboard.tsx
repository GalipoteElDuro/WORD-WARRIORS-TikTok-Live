import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Rank } from '../types';
import { Trophy, Target, Shield, Clock, Calendar, Globe } from 'lucide-react';

interface LeaderboardProps {
  users: User[];
}

type TimeFilter = 'session' | 'day' | 'week' | 'month' | 'all';

const getRankIcon = (rank: Rank) => {
  switch (rank) {
    case Rank.LEGEND: return <Trophy className="w-4 h-4 text-yellow-400" />;
    case Rank.SNIPER: return <Target className="w-4 h-4 text-green-400" />;
    default: return <Shield className="w-4 h-4 text-gray-400" />;
  }
};

const getRankClass = (rank: Rank) => {
  switch (rank) {
    case Rank.LEGEND: return 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 font-black animate-pulse';
    case Rank.SNIPER: return 'text-green-400 font-bold shadow-green-500/50';
    default: return 'text-gray-400';
  }
};

export default function Leaderboard({ users }: LeaderboardProps) {
  const [filter, setFilter] = useState<TimeFilter>('session');

  const getFilteredUsers = () => {
    return [...users].sort((a, b) => {
      switch (filter) {
        case 'session': return b.score - a.score;
        case 'day': return b.scoreDay - a.scoreDay;
        case 'week': return b.scoreWeek - a.scoreWeek;
        case 'month': return b.scoreMonth - a.scoreMonth;
        case 'all': return b.scoreAllTime - a.scoreAllTime;
        default: return b.score - a.score;
      }
    });
  };

  const getScore = (user: User) => {
    switch (filter) {
      case 'session': return user.score;
      case 'day': return user.scoreDay;
      case 'week': return user.scoreWeek;
      case 'month': return user.scoreMonth;
      case 'all': return user.scoreAllTime;
      default: return user.score;
    }
  };

  const filters = [
    { id: 'session', label: 'Sesión', icon: <Clock className="w-3 h-3" /> },
    { id: 'day', label: 'Día', icon: <Calendar className="w-3 h-3" /> },
    { id: 'week', label: 'Semana', icon: <Calendar className="w-3 h-3" /> },
    { id: 'month', label: 'Mes', icon: <Calendar className="w-3 h-3" /> },
    { id: 'all', label: 'Global', icon: <Globe className="w-3 h-3" /> },
  ];

  return (
    <div className="w-80 bg-black/40 backdrop-blur-xl border-l border-white/10 h-full flex flex-col p-4 overflow-hidden">
      <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        GUERREROS
      </h2>

      {/* Time Filters */}
      <div className="flex flex-wrap gap-1 mb-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as TimeFilter)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
              filter === f.id 
                ? 'bg-yellow-500 text-black' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {getFilteredUsers().map((user, index) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                index < 3 
                  ? 'bg-white/10 border-white/20 shadow-lg shadow-white/5' 
                  : 'bg-white/5 border-transparent'
              }`}
            >
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className={`w-10 h-10 rounded-full border-2 ${
                    index === 0 ? 'border-yellow-500 scale-110' : 'border-white/20'
                  }`}
                />
                {index < 3 && (
                  <div className="absolute -top-1 -left-1 bg-yellow-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-bold truncate ${getRankClass(user.rank)}`}>
                    {user.username}
                  </span>
                  {getRankIcon(user.rank)}
                </div>
                <div className="text-xs text-white/50 font-mono">
                  {getScore(user).toLocaleString()} PTS
                </div>
              </div>

              {user.lastAction && filter === 'session' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded"
                >
                  {user.lastAction}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
