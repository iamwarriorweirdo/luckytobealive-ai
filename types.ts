
export enum Emotion {
  Neutral = 'neutral',
  Happy = 'happy',
  Concerned = 'concerned',
  Excited = 'excited',
  Thinking = 'thinking',
  Calm = 'calm'
}

export interface Message {
  id: string;
  sender: 'user' | 'aura';
  text: string;
  timestamp: Date;
  emotion?: Emotion;
}

export interface AuraState {
  emotion: Emotion;
  affinity: number; // 0-100
  favors: number; // "Karma" or "Favor" points
  isListening: boolean;
  isSpeaking: boolean;
}
