import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Rank, GameSettings } from '../types';

const WS_URL = 'ws://localhost:3001';

const DEFAULT_SETTINGS: GameSettings = {
  likesGoal: 500,
  giftActions: []
};

const FALLBACK_LEVELS = [
  {
    word: 'PLAYA',
    hint: '4 imágenes, 1 palabra',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1473119115634-941d078ecb65?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1506929199175-60903ee8f5a9?auto=format&fit=crop&w=400&q=80',
    ]
  },
  {
    word: 'CAFE',
    hint: 'Bebida despertadora',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497933321027-94483effe30d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80',
    ]
  },
  {
    word: 'MUSICA',
    hint: 'Arte de los sonidos',
    images: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1514525253361-bee2438cb5ca?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=400&q=80',
    ]
  }
];

export function useTikTokLive(isLoggedIn: boolean = true, tiktokUsername: string = '', settings: GameSettings = DEFAULT_SETTINGS) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentLevel, setCurrentLevel] = useState(FALLBACK_LEVELS[0]);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [levelNumber, setLevelNumber] = useState(1);
  const [likesCount, setLikesCount] = useState(0);
  const [isHintRevealed, setIsHintRevealed] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [lastComment, setLastComment] = useState<{username: string, text: string} | null>(null);
  const [lastWinner, setLastWinner] = useState<{username: string, avatar?: string, word?: string} | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const handleEventRef = useRef<(event: any) => void>(() => {});
  const settingsRef = useRef(settings);
  const isPreloadingRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const getRank = (score: number): Rank => {
    if (score >= 5000) return Rank.LEGEND;
    if (score >= 500) return Rank.SNIPER;
    return Rank.RECRUIT;
  };

  const generateLevelData = async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY no configurada");
      return null;
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
              content: `Elige una palabra secreta en español (sustantivo común, 4-8 letras) y 4 conceptos visuales para un juego tipo '4 fotos 1 palabra'. Responde solo JSON: {'word', 'hint', 'clues' (array de 4 strings)}`
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
    } catch (e) {
      console.error("Error pre-generando:", e);
      return null;
    }
  };

  const preloadNextLevel = async () => {
    if (isPreloadingRef.current || nextLevel) return;
    isPreloadingRef.current = true;
    const level = await generateLevelData();
    if (level) setNextLevel(level);
    isPreloadingRef.current = false;
  };

  useEffect(() => {
    preloadNextLevel();
  }, [currentLevel]);

  const fetchNextLevel = async (isInitial = false) => {
    setLikesCount(0);
    setIsHintRevealed(false);
    setRevealedIndices([]);
    
    if (isInitial) {
      const randomFallback = FALLBACK_LEVELS[Math.floor(Math.random() * FALLBACK_LEVELS.length)];
      setCurrentLevel(randomFallback);
      preloadNextLevel();
    } else {
      setLevelNumber(prev => prev + 1);
      if (nextLevel) {
        setCurrentLevel(nextLevel);
        setNextLevel(null);
      } else {
        const randomFallback = FALLBACK_LEVELS[Math.floor(Math.random() * FALLBACK_LEVELS.length)];
        setCurrentLevel(randomFallback);
        preloadNextLevel();
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
          
          setLastWinner({ username: event.username, avatar: event.avatar, word: currentLevel.word });
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
        if (newCount >= settingsRef.current.likesGoal && !isHintRevealed) {
          setIsHintRevealed(true);
        }
        return newCount;
      });
    } else if (event.type === 'GIFT') {
      const giftName = event.giftName || '';
      
      const giftMapping = settingsRef.current.giftActions.find(ga => 
        ga.name.toLowerCase() === giftName.toLowerCase()
      );

      if (giftMapping) {
        if (giftMapping.action === 'freeze') {
          setIsFrozen(true);
          setTimeout(() => setIsFrozen(false), 5000);
        } else if (giftMapping.action === 'reveal') {
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
  }, [currentLevel, isLoggedIn, isLoadingNext, nextLevel, isHintRevealed, fetchNextLevel, getRank]);

  handleEventRef.current = handleEvent;

  useEffect(() => {
    if (isLoggedIn) {
      fetchNextLevel(true);
    }
  }, [isLoggedIn]);

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
        ws.send(JSON.stringify({ type: 'CONNECT', username: tiktokUsername }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TIKTOK_STATUS') {
            setConnectionStatus(data.status === 'connected' ? 'connected' : 'disconnected');
          } else if (data.type === 'TIKTOK_ERROR') {
            setConnectionStatus('disconnected');
          } else if (data.type === 'STREAM_END') {
            setConnectionStatus('disconnected');
          } else {
            handleEventRef.current(data);
          }
        } catch {}
      };

      ws.onclose = () => {
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

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'DISCONNECT' }));
      wsRef.current.close();
    }
  }, []);

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
    disconnect
  };
}
