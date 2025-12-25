
export enum Emotion {
  Neutral = 'neutral',
  Happy = 'happy',
  Concerned = 'concerned',
  Excited = 'excited',
  Thinking = 'thinking',
  Calm = 'calm',
  // New mapped emotions
  Smiling = 'smiling',
  Surprised = 'surprised',
  Concentrated = 'concentrated',
  Empathetic = 'empathetic'
}

export type AnimationType = 'IDLE' | 'TALK' | 'WAVE' | 'THINKING' | 'HAPPY' | 'DISAGREE' | 'EXPLAINING';

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'aura';
  text: string;
  timestamp: Date;
  emotion?: Emotion;
  sources?: Source[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'tool' | 'error' | 'thought';
  content: string;
}

export interface KnowledgeItem {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'indexed' | 'processing';
}

export interface AuraState {
  emotion: Emotion;
  affinity: number; // 0-100
  favors: number; // "Karma" or "Favor" points
  isListening: boolean;
  isSpeaking: boolean;
}
