import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Heart, Gift, User, LogOut, Plus, Trash2 } from 'lucide-react';
import { GameSettings, GiftAction } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onDisconnect: () => void;
  username: string;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave, onDisconnect, username }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftAction, setNewGiftAction] = useState<'reveal' | 'freeze'>('reveal');

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const addGiftAction = () => {
    if (!newGiftName.trim()) return;
    const newAction: GiftAction = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGiftName.trim(),
      action: newGiftAction
    };
    setLocalSettings(prev => ({
      ...prev,
      giftActions: [...prev.giftActions, newAction]
    }));
    setNewGiftName('');
  };

  const removeGiftAction = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      giftActions: prev.giftActions.filter(a => a.id !== id)
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Configuración</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 uppercase text-[10px] font-black tracking-widest">
                  <User className="w-3 h-3" />
                  <span>Sesión Actual</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-white">
                      {username[0]?.toUpperCase()}
                    </div>
                    <span className="font-bold text-white">@{username}</span>
                  </div>
                  <button 
                    onClick={onDisconnect}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    CAMBIAR USUARIO
                  </button>
                </div>
              </div>

              {/* Likes Goal */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 uppercase text-[10px] font-black tracking-widest">
                  <Heart className="w-3 h-3" />
                  <span>Meta de Likes</span>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="100" 
                    max="5000" 
                    step="100"
                    value={localSettings.likesGoal}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, likesGoal: parseInt(e.target.value) }))}
                    className="flex-1 accent-pink-500 h-1.5 bg-white/10 rounded-full"
                  />
                  <span className="w-16 text-center font-black text-white bg-pink-500/20 text-pink-400 py-2 rounded-xl border border-pink-500/30">
                    {localSettings.likesGoal}
                  </span>
                </div>
              </div>

              {/* Gifts Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 uppercase text-[10px] font-black tracking-widest">
                  <Gift className="w-3 h-3" />
                  <span>Asignación de Regalos</span>
                </div>
                
                {/* Add New Mapping */}
                <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
                  <input 
                    type="text" 
                    placeholder="Nombre del regalo (ej. Rosa)"
                    value={newGiftName}
                    onChange={(e) => setNewGiftName(e.target.value)}
                    className="flex-1 px-3 bg-transparent border-none text-white text-sm font-bold focus:ring-0 placeholder:text-white/20"
                  />
                  <select 
                    value={newGiftAction}
                    onChange={(e) => setNewGiftAction(e.target.value as 'reveal' | 'freeze')}
                    className="bg-zinc-800 text-white text-xs font-bold rounded-xl border-none focus:ring-0 px-2"
                  >
                    <option value="reveal">Revelar Letra</option>
                    <option value="freeze">Congelar</option>
                  </select>
                  <button 
                    onClick={addGiftAction}
                    className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-400 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* List of Mappings */}
                <div className="space-y-2">
                  {localSettings.giftActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{action.name}</span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                          action.action === 'reveal' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {action.action === 'reveal' ? 'Revelar' : 'Congelar'}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeGiftAction(action.id)}
                        className="p-1.5 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {localSettings.giftActions.length === 0 && (
                    <div className="text-center py-8 text-white/20 text-xs italic">
                      No hay regalos asignados. Agrégalos arriba.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 px-6 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-500/20 uppercase tracking-widest text-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
