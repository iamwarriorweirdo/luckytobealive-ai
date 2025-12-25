import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { Message, Emotion, AnimationType } from '@/types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, encode } from '@/utils/audioUtils';

export const useAIBrain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimation, setEmotion, setIsSpeaking, customSystemInstruction, addLog } = useStore();
  
  // Refs cho Live API
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // 1. Text Chat Interaction (Gọi Serverless API)
  const chatText = async (message: string): Promise<Message | null> => {
    setIsLoading(true);
    setAnimation('THINKING');
    addLog('thought', 'Processing text via Serverless Brain...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!res.ok) throw new Error("API Route failed");

      const data = await res.json();
      
      // Update 3D State
      const anim = data.action_3d?.animation || 'TALK';
      const expr = data.action_3d?.expression?.toUpperCase() || 'NEUTRAL';
      
      setAnimation(anim as AnimationType);
      
      // Map Expression string to Emotion Enum (Simple logic)
      let mappedEmotion = Emotion.Neutral;
      if (expr.includes('HAPPY') || expr.includes('SMILE')) mappedEmotion = Emotion.Happy;
      else if (expr.includes('SAD') || expr.includes('CONCERN')) mappedEmotion = Emotion.Concerned;
      else if (expr.includes('THINK')) mappedEmotion = Emotion.Thinking;
      
      setEmotion(mappedEmotion);

      // Trigger Speaking Animation mockup
      setIsSpeaking(true);
      setTimeout(() => { setIsSpeaking(false); setAnimation('IDLE'); }, 3000);

      addLog('info', `Brain responded: ${data.response.display_text.substring(0, 20)}...`);

      return {
        id: Date.now().toString(),
        sender: 'aura',
        text: data.response.display_text,
        timestamp: new Date(),
        emotion: mappedEmotion,
        sources: [] // Add source handling if needed
      };

    } catch (error: any) {
      console.error(error);
      addLog('error', `Brain Error: ${error.message}`);
      setAnimation('IDLE');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Live Voice Interaction (Client-side Direct Connection)
  // Lưu ý: Live API cần WebSockets nên khó chạy qua Serverless Functions thuần túy.
  // Ta giữ logic này ở Client nhưng dùng process.env.API_KEY từ env client.
  const connectLiveVoice = async (onSpeakingStateChange: (state: boolean) => void) => {
    addLog('info', 'Initializing Live Voice Session...');
    try {
       const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY }); // Next.js cần NEXT_PUBLIC_ cho client vars
       
       if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => addLog('info', 'Live Voice Connected'),
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              onSpeakingStateChange(true);
              setAnimation('TALK');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.onended = () => {
                  onSpeakingStateChange(false);
                  setAnimation('IDLE');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
          },
          onclose: () => addLog('info', 'Live Voice Closed'),
          onerror: (e) => addLog('error', 'Live Voice Error')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: customSystemInstruction
        }
      });
      sessionRef.current = await sessionPromise;
      return { session: sessionPromise, inputContext: inputAudioContext, stream };

    } catch (e: any) {
      addLog('error', `Voice Connection Failed: ${e.message}`);
      throw e;
    }
  };

  const disconnectLiveVoice = () => {
      // Logic cleanup logic here
      if(sessionRef.current) sessionRef.current = null;
      addLog('info', 'Live Voice Disconnected');
  };

  return { chatText, connectLiveVoice, disconnectLiveVoice, isLoading, sessionRef };
};