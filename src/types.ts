export enum Rank {
  RECRUIT = 'RECRUIT',
  SNIPER = 'SNIPER',
  LEGEND = 'LEGEND',
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  score: number;
  scoreDay: number;
  scoreWeek: number;
  scoreMonth: number;
  scoreAllTime: number;
  rank: Rank;
  lastAction?: string;
  isWinner?: boolean;
}

export interface GameState {
  currentWord: string;
  hint: string;
  images: string[];
  blurAmount: number;
  isFrozen: boolean;
  isSuddenDeath: boolean;
  timeLeft: number;
  users: User[];
  winner: User | null;
}

export type TikTokEvent = 
  | { type: 'COMMENT'; username: string; text: string; avatar: string }
  | { type: 'LIKE'; count: number }
  | { type: 'GIFT'; username: string; giftName: string };
