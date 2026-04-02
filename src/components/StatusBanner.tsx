import { Trophy } from 'lucide-react';

export default function StatusBanner() {
  return (
    <div className="absolute top-4 right-4 z-50 pointer-events-none">
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 rounded-xl backdrop-blur-xl border border-white/10 bg-white/5 text-white flex items-center gap-2 shadow-xl">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-black tracking-tight uppercase text-xs">¡El primero en adivinar gana!</span>
        </div>
      </div>
    </div>
  );
}
