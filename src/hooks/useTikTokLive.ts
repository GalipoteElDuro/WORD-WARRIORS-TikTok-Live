import { useState, useEffect, useCallback } from 'react';
import { User, Rank, TikTokEvent } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MOCK_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Morty',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Summer',
];

const INITIAL_LEVEL = {
  word: 'PLAYA',
  hint: '4 imágenes, 1 palabra',
  images: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1473119115634-941d078ecb65?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506929199175-60903ee8f5a9?auto=format&fit=crop&w=800&q=80',
  ]
};

export function useTikTokLive(isLoggedIn: boolean = true) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentLevel, setCurrentLevel] = useState(INITIAL_LEVEL);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [levelNumber, setLevelNumber] = useState(1);
  const [likesCount, setLikesCount] = useState(0);
  const [isHintRevealed, setIsHintRevealed] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [lastComment, setLastComment] = useState<{username: string, text: string} | null>(null);
  const [lastWinner, setLastWinner] = useState<{username: string, avatar?: string} | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  const getRank = (score: number): Rank => {
    if (score >= 5000) return Rank.LEGEND;
    if (score >= 500) return Rank.SNIPER;
    return Rank.RECRUIT;
  };

  const generateLevelData = async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Actúa como un diseñador de niveles experto para el juego '4 fotos 1 palabra'. 
        1. Elige una palabra secreta (sustantivo o concepto común en español).
        2. Elige 4 conceptos visuales DIFERENTES, ÚNICOS y VARIADOS que representen pistas indirectas de la palabra.
        Responde estrictamente en JSON con los campos:
        'word': la palabra secreta (en mayúsculas, sin acentos).
        'hint': una pista de texto muy breve.
        'clues': un array con los 4 nombres de los conceptos visuales elegidos (ej. si la palabra es 'Fútbol', pistas podrían ser: 'estadio', 'silbato', 'guantes', 'cesped').`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              hint: { type: Type.STRING },
              clues: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 4,
                maxItems: 4
              }
            },
            required: ["word", "hint", "clues"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      const word = data.word?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "ERROR";
      const hint = data.hint || "4 imágenes, 1 palabra";
      const clues = data.clues || ["pista1", "pista2", "pista3", "pista4"];
      const levelId = Math.random().toString(36).substring(7);

      // Use a high-quality image service with unique keywords and seeds to GUARANTEE variety
      const finalImages = clues.map((clue: string, i: number) => {
        // We use Unsplash Source or LoremFlickr with unique seeds and keywords
        return `https://loremflickr.com/800/600/${encodeURIComponent(clue)}?lock=${levelId}${i}`;
      });

      return { word, hint, images: finalImages, levelId };
    } catch (error) {
      console.error("Error generating level data:", error);
      const fallbackWord = "VIAJE";
      const levelId = Math.random().toString(36).substring(7);
      return {
        word: fallbackWord,
        hint: "4 imágenes, 1 palabra",
        levelId,
        images: [
          `https://loremflickr.com/800/600/maleta?lock=${levelId}1`,
          `https://loremflickr.com/800/600/avion?lock=${levelId}2`,
          `https://loremflickr.com/800/600/mapa?lock=${levelId}3`,
          `https://loremflickr.com/800/600/pasaporte?lock=${levelId}4`
        ]
      };
    }
  };

  const fetchNextLevel = async (isInitial = false) => {
    setLikesCount(0);
    setIsHintRevealed(false);
    
    if (isInitial) {
      setIsLoadingNext(true);
      const level = await generateLevelData();
      setCurrentLevel(level);
      setIsLoadingNext(false);
      // Pre-fetch the next one
      const next = await generateLevelData();
      setNextLevel(next);
    } else {
      // Increment level number
      setLevelNumber(prev => prev + 1);
      
      // If we have a pre-fetched level, use it
      if (nextLevel) {
        setCurrentLevel(nextLevel);
        setRevealedIndices([]);
        // Fetch the next one in background
        generateLevelData().then(setNextLevel);
      } else {
        // Fallback if pre-fetch isn't ready
        setIsLoadingNext(true);
        const level = await generateLevelData();
        setCurrentLevel(level);
        setRevealedIndices([]);
        setIsLoadingNext(false);
        generateLevelData().then(setNextLevel);
      }
    }
  };

  const handleEvent = useCallback((event: TikTokEvent) => {
    if (!isLoggedIn || isLoadingNext) return;
    if (event.type === 'COMMENT') {
      setLastComment({ username: event.username, text: event.text });
      
      setUsers(prev => {
        const userIndex = prev.findIndex(u => u.username === event.username);
        let newUsers = [...prev];
        let currentUser: User;

        if (userIndex === -1) {
          currentUser = {
            id: Math.random().toString(),
            username: event.username,
            avatar: event.avatar,
            score: 0,
            scoreDay: Math.floor(Math.random() * 500),
            scoreWeek: Math.floor(Math.random() * 2000),
            scoreMonth: Math.floor(Math.random() * 5000),
            scoreAllTime: Math.floor(Math.random() * 10000),
            rank: Rank.RECRUIT,
          };
          newUsers.push(currentUser);
        } else {
          currentUser = { ...newUsers[userIndex] };
        }

        const isCorrect = event.text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === currentLevel.word;
        
        if (isCorrect) {
          currentUser.score += 100;
          currentUser.scoreDay += 100;
          currentUser.scoreWeek += 100;
          currentUser.scoreMonth += 100;
          currentUser.scoreAllTime += 100;
          currentUser.rank = getRank(currentUser.scoreAllTime);
          currentUser.lastAction = '¡GANADOR!';
          
          setLastWinner({ username: event.username, avatar: event.avatar });
          setTimeout(() => setLastWinner(null), 4000);

          fetchNextLevel();
        }

        if (userIndex === -1) {
          newUsers[newUsers.length - 1] = currentUser;
        } else {
          newUsers[userIndex] = currentUser;
        }

        return newUsers.sort((a, b) => b.score - a.score);
      });
    } else if (event.type === 'LIKE') {
      setLikesCount(prev => {
        const newCount = prev + event.count;
        if (newCount >= 500 && !isHintRevealed) {
          setIsHintRevealed(true);
        }
        return newCount;
      });
    } else if (event.type === 'GIFT') {
      if (event.giftName === 'Ice') {
        setIsFrozen(true);
        setTimeout(() => setIsFrozen(false), 5000);
      } else {
        setRevealedIndices(prev => {
          const word = currentLevel.word;
          const unrevealed = [];
          for (let i = 0; i < word.length; i++) {
            if (!prev.includes(i)) unrevealed.push(i);
          }
          if (unrevealed.length === 0) return prev;
          const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          return [...prev, randomIndex];
        });
      }
    }
  }, [currentLevel, isLoggedIn, isLoadingNext, nextLevel]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNextLevel(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || isLoadingNext) return;
    const interval = setInterval(() => {
      const randomUser = `Usuario_${Math.floor(Math.random() * 100)}`;
      const randomAvatar = MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
      
      const isLucky = Math.random() > 0.98;
      const text = isLucky ? currentLevel.word : 'ERROR';

      handleEvent({
        type: 'COMMENT',
        username: randomUser,
        avatar: randomAvatar,
        text: text
      });
    }, 2000);

    const giftInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        handleEvent({
          type: 'GIFT',
          username: `Donador_${Math.floor(Math.random() * 10)}`,
          giftName: 'Rosa'
        });
      }
      
      // Simulate likes
      handleEvent({
        type: 'LIKE',
        count: Math.floor(Math.random() * 10) + 5
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(giftInterval);
    };
  }, [handleEvent, currentLevel, isLoggedIn, isLoadingNext]);

  return {
    users,
    currentWord: currentLevel,
    levelNumber,
    likesCount,
    isHintRevealed,
    isFrozen,
    revealedIndices,
    lastComment,
    lastWinner,
    isLoadingNext
  };
}
