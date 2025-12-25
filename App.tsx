
import React, { useState, useEffect, useRef } from 'react';
import { Message, Emotion } from './types';
import Avatar from './components/Avatar';
import ChatInterface from './components/ChatInterface';
import { chatWithAura, decode, decodeAudioData, encode } from './services/geminiService';
import { useStore } from './store';
import { Mic, MicOff, Heart, Box, ShieldCheck } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Zustand Store
  const { currentAnimation, setAnimation, setEmotion, setIsSpeaking, isSpeaking } = useStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      sender: 'aura',
      text: "Xin chào Companion. luckytobealive.AI đã sẵn sàng kết nối thần kinh. Tôi có thể giúp gì cho bạn?",
      timestamp: new Date(),
      emotion: Emotion.Calm
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setAnimation('THINKING');

    try {
      const data = await chatWithAura(inputValue);
      
      setAnimation(data.animation);
      setEmotion(data.emotion as Emotion);

      const auraMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'aura',
        text: data.text,
        timestamp: new Date(),
        emotion: data.emotion as Emotion
      };

      setMessages(prev => [...prev, auraMsg]);
      
      setIsSpeaking(true);
      setTimeout(() => {
        setIsSpeaking(false);
        setAnimation('IDLE');
      }, 3000);

    } catch (error) {
      console.error(error);
      setAnimation('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connects to the Gemini Live API for real-time voice interaction.
   * Follows the official Session Setup guidelines.
   */
  const toggleVoice = async () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      if (sessionRef.current) sessionRef.current.close?.();
      return;
    }

    try {
      setIsVoiceActive(true);
      // Guidelines: Always create a new GoogleGenAI instance with named apiKey parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              // CRITICAL: initiate sendRealtimeInput only after session connection resolves
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { 
                    data: encode(new Uint8Array(int16.buffer)), 
                    mimeType: 'audio/pcm;rate=16000' 
                  }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              setIsSpeaking(true);
              setAnimation('TALK');
              
              // Guidelines: Schedule next chunk at exact end time of previous to ensure gapless playback
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              
              const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              
              source.onended = () => {
                // Heuristic to check if playback queue is likely empty
                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
                  setIsSpeaking(false);
                  setAnimation('IDLE');
                }
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }

            if (message.serverContent?.interrupted) {
              // Interruption handling
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
              setAnimation('IDLE');
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            setIsVoiceActive(false);
          },
          onclose: () => {
            setIsVoiceActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are Aura, the intelligent 3D assistant for luckytobealive.AI. Speak warmly and helpfully. Always address the user as 'Companion'."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to establish neural link:', err);
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full premium-gradient text-white p-4 gap-6 overflow-hidden">
      {/* Sidebar Brand */}
      <div className="lg:w-80 flex flex-col gap-4 order-2 lg:order-1 shrink-0">
        <div className="glass-morphism p-8 rounded-[40px] space-y-8 border border-white/10 h-full overflow-y-auto">
          <div className="space-y-1">
            <h1 className="font-outfit font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-300">
              luckytobealive.AI
            </h1>
            <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Protocol: Neural_3D</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-medium text-white/50 flex items-center gap-2">
                  <Heart size={14} className="text-rose-500" /> BRAIN SYNC
                </span>
                <span className="text-sm font-bold text-violet-400">98.2%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 w-[98.2%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-morphism p-4 rounded-2xl border border-white/5">
                <ShieldCheck size={18} className="text-emerald-400 mb-2" />
                <div className="text-[10px] text-white/40 uppercase font-bold">Latency</div>
                <div className="text-xs font-bold">12ms</div>
              </div>
              <div className="glass-morphism p-4 rounded-2xl border border-white/5">
                <Box size={18} className="text-amber-400 mb-2" />
                <div className="text-[10px] text-white/40 uppercase font-bold">Engine</div>
                <div className="text-xs font-bold">R3F</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={toggleVoice}
          className={`w-full py-5 rounded-[32px] flex items-center justify-center gap-3 font-outfit font-extrabold transition-all duration-500 ${
            isVoiceActive 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]' 
              : 'bg-white text-black hover:scale-[0.98]'
          }`}
        >
          {isVoiceActive ? <MicOff size={22} /> : <Mic size={22} />}
          {isVoiceActive ? 'END LINK' : 'NEURAL LINK'}
        </button>
      </div>

      {/* Main Avatar 3D Display */}
      <div className="flex-1 relative order-1 lg:order-2 flex items-center justify-center bg-[#070709] rounded-[48px] border border-white/5 overflow-hidden">
        <Avatar />

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
          <div className="px-8 py-3 rounded-full glass-morphism border-2 border-white/10 font-outfit font-black uppercase tracking-[0.3em] text-[10px] text-white/50">
            AURA STATUS: {currentAnimation}
          </div>
          <div className="text-[10px] text-white/20 font-mono tracking-widest flex items-center gap-2">
            <span className={`w-1 h-1 rounded-full ${isSpeaking ? 'bg-green-500 animate-ping' : 'bg-white/20'}`} />
            REALTIME_3D_STREAMING
          </div>
        </div>
      </div>

      {/* Chat History Panel */}
      <div className="lg:w-96 h-full order-3 shrink-0">
        <ChatInterface 
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default App;
