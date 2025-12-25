
import { create } from 'zustand';
import { Emotion, LogEntry, KnowledgeItem, AnimationType } from './types';
import { SYSTEM_INSTRUCTION } from './constants';

interface AppState {
  currentAnimation: AnimationType;
  currentEmotion: Emotion;
  isSpeaking: boolean;
  isCameraActive: boolean;
  
  // Admin & Evolution State
  isAdminOpen: boolean;
  customSystemInstruction: string;
  logs: LogEntry[];
  knowledgeBase: KnowledgeItem[];

  setAnimation: (anim: AnimationType) => void;
  setEmotion: (emotion: Emotion) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsCameraActive: (active: boolean) => void;
  toggleAdmin: () => void;
  updateSystemInstruction: (instruction: string) => void;
  addLog: (type: LogEntry['type'], content: string) => void;
  addKnowledge: (item: KnowledgeItem) => void;
}

export const useStore = create<AppState>((set) => ({
  currentAnimation: 'IDLE',
  currentEmotion: Emotion.Neutral,
  isSpeaking: false,
  isCameraActive: false,
  
  isAdminOpen: false,
  customSystemInstruction: SYSTEM_INSTRUCTION,
  logs: [],
  knowledgeBase: [],

  setAnimation: (anim) => set({ currentAnimation: anim }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setIsCameraActive: (active) => set({ isCameraActive: active }),
  
  toggleAdmin: () => set((state) => ({ isAdminOpen: !state.isAdminOpen })),
  updateSystemInstruction: (instruction) => set({ customSystemInstruction: instruction }),
  addLog: (type, content) => set((state) => ({ 
    logs: [{ id: Date.now().toString(), timestamp: new Date(), type, content }, ...state.logs].slice(0, 100) 
  })),
  addKnowledge: (item) => set((state) => ({ knowledgeBase: [...state.knowledgeBase, item] })),
}));
