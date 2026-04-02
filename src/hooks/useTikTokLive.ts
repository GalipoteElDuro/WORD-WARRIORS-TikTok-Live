import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Rank } from '../types';

const WS_URL = 'ws://localhost:3001';

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

export function useTikTokLive(isLoggedIn: boolean = true, tiktokUsername: string = '') {
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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const handleEventRef = useRef<(event: any) => void>(() => {});

  const getRank = (score: number): Rank => {
    if (score >= 5000) return Rank.LEGEND;
    if (score >= 500) return Rank.SNIPER;
    return Rank.RECRUIT;
  };

  const generateLevelData = async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY no configurada");
      throw new Error("API key no configurada");
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-OpenRouter-Title': 'Word Warriors TikTok Live',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'openrouter/free',
          messages: [
            {
              role: 'user',
              content: `Actúa como un diseñador de niveles experto para el juego '4 fotos 1 palabra'. 
              1. Elige una palabra secreta (sustantivo o concepto común en español).
              2. Elige 4 conceptos visuales DIFERENTES, ÚNICOS y VARIADOS que representen pistas indirectas de la palabra.
              Responde estrictamente en JSON con los campos:
              'word': la palabra secreta (en mayúsculas, sin acentos).
              'hint': una pista de texto muy breve.
              'clues': un array con los 4 nombres de los conceptos visuales elegidos (ej. si la palabra es 'Fútbol', pistas podrían ser: 'estadio', 'silbato', 'guantes', 'cesped').`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '{}';
      const data = JSON.parse(content);
      const word = data.word?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "ERROR";
      const hint = data.hint || "4 imágenes, 1 palabra";
      const clues = data.clues || ["pista1", "pista2", "pista3", "pista4"];
      const levelId = Math.random().toString(36).substring(7);

      const finalImages = clues.map((clue: string, i: number) => {
        return `https://loremflickr.com/800/600/${encodeURIComponent(clue)}?lock=${levelId}${i}`;
      });

      return { word, hint, images: finalImages, levelId };
    } catch (error) {
      console.error("Error generando nivel:", error);
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
      const next = await generateLevelData();
      setNextLevel(next);
    } else {
      setLevelNumber(prev => prev + 1);
      if (nextLevel) {
        setCurrentLevel(nextLevel);
        setRevealedIndices([]);
        generateLevelData().then(setNextLevel);
      } else {
        setIsLoadingNext(true);
        const level = await generateLevelData();
        setCurrentLevel(level);
        setRevealedIndices([]);
        setIsLoadingNext(false);
        generateLevelData().then(setNextLevel);
      }
    }
  };

  const handleEvent = useCallback((event: any) => {
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
            avatar: event.avatar || '',
            score: 0,
            scoreDay: 0,
            scoreWeek: 0,
            scoreMonth: 0,
            scoreAllTime: 0,
            rank: Rank.RECRUIT,
          };
          newUsers.push(currentUser);
        } else {
          currentUser = { ...newUsers[userIndex] };
        }

        const normalizedText = event.text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isCorrect = normalizedText === currentLevel.word;
        
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

        const idx = newUsers.findIndex(u => u.username === event.username);
        if (idx !== -1) {
          newUsers[idx] = currentUser;
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
      const giftName = event.giftName || '';
      if (giftName.toLowerCase().includes('ice') || giftName.toLowerCase().includes('hielo')) {
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
    } else if (event.type === 'FOLLOW') {
      setUsers(prev => {
        const idx = prev.findIndex(u => u.username === event.username);
        if (idx !== -1) {
          const updated = { ...prev[idx] };
          updated.score += 50;
          updated.lastAction = '¡SIGUIÓ!';
          const newUsers = [...prev];
          newUsers[idx] = updated;
          return newUsers.sort((a, b) => b.score - a.score);
        }
        return prev;
      });
    } else if (event.type === 'SHARE') {
      setUsers(prev => {
        const idx = prev.findIndex(u => u.username === event.username);
        if (idx !== -1) {
          const updated = { ...prev[idx] };
          updated.score += 25;
          updated.lastAction = '¡COMPARTIÓ!';
          const newUsers = [...prev];
          newUsers[idx] = updated;
          return newUsers.sort((a, b) => b.score - a.score);
        }
        return prev;
      });
    }
  }, [currentLevel, isLoggedIn, isLoadingNext, nextLevel, isHintRevealed]);

  // Keep handleEvent ref updated
  handleEventRef.current = handleEvent;

  useEffect(() => {
    if (isLoggedIn) {
      fetchNextLevel(true);
    }
  }, [isLoggedIn]);

  // WebSocket connection to backend
  useEffect(() => {
    if (!isLoggedIn || !tiktokUsername) return;

    let shouldReconnect = true;

    function connect() {
      setConnectionStatus('connecting');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!shouldReconnect) {
          ws.close();
          return;
        }
        console.log('[WS] Conectado al backend');
        ws.send(JSON.stringify({ type: 'CONNECT', username: tiktokUsername }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'TIKTOK_STATUS') {
            setConnectionStatus(data.status === 'connected' ? 'connected' : 'disconnected');
          } else if (data.type === 'TIKTOK_ERROR') {
            console.error('[TikTok] Error:', data.error);
            setConnectionStatus('disconnected');
          } else if (data.type === 'STREAM_END') {
            setConnectionStatus('disconnected');
          } else {
            handleEventRef.current(data);
          }
        } catch (e) {
          console.error('[WS] Error parseando mensaje:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Desconectado del backend');
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
      };

      return ws;
    }

    const ws = connect();

    return () => {
      shouldReconnect = false;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [isLoggedIn, tiktokUsername]);

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
    isLoadingNext,
    connectionStatus,
  };
}
