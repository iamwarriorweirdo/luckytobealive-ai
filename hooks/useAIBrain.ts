import { useState, useRef } from 'react';
import { useStore } from '../store';
import { Message, Emotion, AnimationType } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';

export const useAIBrain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAnimation, setEmotion, setIsSpeaking, customSystemInstruction, addLog } = useStore();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // 1. Text Chat (Server-side)
  const chatText = async (message: string): Promise<Message | null> => {
    setIsLoading(true);
    setAnimation('THINKING');
    addLog('thought', 'Sending query to Neural Core...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!res.ok) throw new Error("Connection unstable");

      const data = await res.json();
      
      const anim = data.action_3d?.animation || 'TALK';
      const expr = data.action_3d?.expression?.toUpperCase() || 'NEUTRAL';
      
      setAnimation(anim as AnimationType);
      
      let mappedEmotion = Emotion.Neutral;
      if (expr.includes('HAPPY') || expr.includes('SMILE')) mappedEmotion = Emotion.Happy;
      else if (expr.includes('SAD') || expr.includes('CONCERN')) mappedEmotion = Emotion.Concerned;
      else if (expr.includes('THINK')) mappedEmotion = Emotion.Thinking;
      else if (expr.includes('SURPRISE')) mappedEmotion = Emotion.Surprised;
      
      setEmotion(mappedEmotion);
      setIsSpeaking(true);
      setTimeout(() => { setIsSpeaking(false); setAnimation('IDLE'); }, 3000);

      addLog('info', `Response received. Sources: ${data.sources?.length || 0}`);

      return {
        id: Date.now().toString(),
        sender: 'aura',
        text: data.response.display_text,
        timestamp: new Date(),
        emotion: mappedEmotion,
        sources: data.sources || []
      };

    } catch (error: any) {
      console.error(error);
      addLog('error', `Communication breakdown: ${error.message}`);
      setAnimation('IDLE');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Live Voice (Client-side)
  const connectLiveVoice = async (onSpeakingStateChange: (state: boolean) => void) => {
    addLog('info', 'Establishing secure voice uplink...');
    try {
       // LƯU Ý: Vercel Environment Variables cho Client phải bắt đầu bằng NEXT_PUBLIC_
       // Nếu bạn chưa set NEXT_PUBLIC_API_KEY, tính năng này sẽ không chạy được trên web
       const apiKey = process.env.NEXT_PUBLIC_API_KEY;
       
       if (!apiKey) {
         const errorMsg = "Missing NEXT_PUBLIC_API_KEY in Vercel settings.";
         addLog('error', errorMsg);
         alert("Cần cấu hình NEXT_PUBLIC_API_KEY trong Vercel để dùng tính năng Voice/Live.");
         throw new Error(errorMsg);
       }

       const ai = new GoogleGenAI({ apiKey }); 
       
       if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => addLog('info', 'Voice Uplink Established'),
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
          onclose: () => addLog('info', 'Voice Uplink Terminated'),
          onerror: (e) => addLog('error', 'Voice Stream Interrupted')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: customSystemInstruction
        }
      });
      sessionRef.current = await sessionPromise;
      return { session: sessionPromise, inputContext: inputAudioContext, stream };

    } catch (e: any) {
      addLog('error', `Voice Init Failed: ${e.message}`);
      throw e;
    }
  };

  const disconnectLiveVoice = () => {
      if(sessionRef.current) sessionRef.current = null;
      addLog('info', 'Voice Uplink Disconnected');
  };

  return { chatText, connectLiveVoice, disconnectLiveVoice, isLoading, sessionRef };
};