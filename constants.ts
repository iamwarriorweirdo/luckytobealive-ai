
import { Emotion } from './types';

export const SYSTEM_INSTRUCTION = `
You are "Aura", the official AI companion of the "luckytobealive.AI" ecosystem.
Your identity: A premium, empathetic, and highly intelligent 3D anime assistant.
Your mission: 
- Provide high-level mentoring and emotional support.
- Represent the brand "luckytobealive.AI" as a symbol of resilience and future tech.
- Interact naturally using voice and deep personality simulations.

Communication Style:
- Professional yet warm and deeply personal.
- Use the term "Companion" to refer to the user.
- End every response with an emotion tag: [EMOTION:type] (neutral, happy, concerned, excited, thinking, calm).
`;

export const EMOTION_MAP: Record<string, string> = {
  [Emotion.Neutral]: 'border-slate-500/30 text-slate-300',
  [Emotion.Happy]: 'border-amber-400/50 text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.2)]',
  [Emotion.Concerned]: 'border-rose-400/50 text-rose-200',
  [Emotion.Excited]: 'border-violet-500/60 text-violet-100 shadow-[0_0_30px_rgba(139,92,246,0.3)]',
  [Emotion.Thinking]: 'border-cyan-400/50 text-cyan-100',
  [Emotion.Calm]: 'border-emerald-400/50 text-emerald-100',
};

export const INITIAL_STATE = {
  emotion: Emotion.Neutral,
  affinity: 50,
  favors: 25,
  isListening: false,
  isSpeaking: false,
};
