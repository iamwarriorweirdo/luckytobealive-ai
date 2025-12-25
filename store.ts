
import { create } from 'zustand';
import { Emotion } from './types';

interface AppState {
  currentAnimation: 'IDLE' | 'TALK' | 'WAVE' | 'THINKING';
  currentEmotion: Emotion;
  isSpeaking: boolean;
  isCameraActive: boolean;
  setAnimation: (anim: 'IDLE' | 'TALK' | 'WAVE' | 'THINKING') => void;
  setEmotion: (emotion: Emotion) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsCameraActive: (active: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  currentAnimation: 'IDLE',
  currentEmotion: Emotion.Neutral,
  isSpeaking: false,
  isCameraActive: false,
  setAnimation: (anim) => set({ currentAnimation: anim }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setIsCameraActive: (active) => set({ isCameraActive: active }),
}));
