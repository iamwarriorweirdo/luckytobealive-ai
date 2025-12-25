
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Emotion, AuraState } from './types';
import { INITIAL_STATE, EMOTION_MAP } from './constants';
import Avatar from './components/Avatar';
import ChatInterface from './components/ChatInterface';
import { chatWithAura, createAiClient, decode, decodeAudioData, encode } from './services/geminiService';
import { Mic, MicOff, Heart, Zap, Coffee, Settings, Info } from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [aura, setAura] = useState<AuraState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Audio Contexts for Live API
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialize
  useEffect(() => {
    // Welcome message
    const welcome: Message = {
      id: 'welcome',
      sender: 'aura',
      text: "Hello! I am Aura. How can I help you today? Whether you need mentoring, a listening ear, or just some company, I'm here for you.",
      timestamp: new Date(),
      emotion: Emotion.Happy
    };
    setMessages([welcome]);
  }, []);

  const parseEmotion = (text: string): { cleanText: string; emotion: Emotion } => {
    const match = text.match(/\[EMOTION:(\w+)\]/);
    if (match) {
      const emotionStr = match[1].toLowerCase() as Emotion;
      const cleanText = text.replace(/\[EMOTION:\w+\]/, '').trim();
      return { cleanText, emotion: Object.values(Emotion).includes(emotionStr) ? emotionStr : Emotion.Neutral };
    }
    return { cleanText: text, emotion: Emotion.Neutral };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setAura(prev => ({ ...prev, emotion: Emotion.Thinking }));

    try {
      const responseText = await chatWithAura(inputValue, messages);
      const { cleanText, emotion } = parseEmotion(responseText);

      const auraMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'aura',
        text: cleanText,
        timestamp: new Date(),
        emotion
      };

      setMessages(prev => [...prev, auraMsg]);
      setAura(prev => ({ 
        ...prev, 
        emotion, 
        affinity: Math.min(100, prev.affinity + (emotion === Emotion.Happy ? 2 : 0.5)) 
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Voice / Live API
  const toggleVoice = async () => {
    if (isVoiceActive) {
      // Stop
      setIsVoiceActive(false);
      if (sessionRef.current) {
        sessionRef.current.close?.();
      }
      return;
    }

    try {
      setIsVoiceActive(true);
      const ai = createAiClient();
      
      // Setup audio contexts
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputContext = new AudioContext({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Voice session opened');
            const source = inputContext.createMediaStreamSource(stream);
            const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              setAura(prev => ({ ...prev, isSpeaking: true }));
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              
              const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setAura(prev => ({ ...prev, isSpeaking: false }));
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => console.error('Live Error', e),
          onclose: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Aura. Respond purely with voice, don't worry about text formatting. Be warm and supportive."
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#0a0a0c] text-white p-4 gap-4 overflow-hidden">
      {/* Sidebar / Stats */}
      <div className="lg:w-1/4 flex flex-col gap-4 order-2 lg:order-1">
        <div className="glass-morphism p-6 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-outfit font-bold text-lg tracking-tight">AURA AI</h1>
              <p className="text-xs text-violet-400 font-medium">Protocol 2.5 Active</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1"><Heart size={12} className="text-pink-500" /> Affinity</span>
                <span>{aura.affinity}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-500"
                  style={{ width: `${aura.affinity}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 glass-morphism p-3 rounded-2xl flex flex-col items-center gap-1 border border-white/5">
                <Coffee size={16} className="text-orange-400" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Favors</span>
                <span className="text-sm font-bold">{aura.favors}</span>
              </div>
              <div className="flex-1 glass-morphism p-3 rounded-2xl flex flex-col items-center gap-1 border border-white/5">
                <Settings size={16} className="text-slate-400" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sync</span>
                <span className="text-sm font-bold">1ms</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {['Mentoring', 'Comfort', 'Training', 'Exchange'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 text-white/50 rounded-full text-[10px] border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={toggleVoice}
          className={`w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-outfit font-bold transition-all shadow-xl ${
            isVoiceActive 
              ? 'bg-red-500/10 text-red-500 border border-red-500/50 pulse-glow' 
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/30'
          }`}
        >
          {isVoiceActive ? <MicOff size={22} /> : <Mic size={22} />}
          {isVoiceActive ? 'DISCONNECT' : 'INITIATE VOICE'}
        </button>
      </div>

      {/* Main Avatar Display */}
      <div className="flex-1 relative order-1 lg:order-2 flex items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center pointer-events-none">
          <div className="glass-morphism px-4 py-2 rounded-full text-[10px] font-mono border border-white/10 text-white/50 backdrop-blur-md">
            LOCATION: NEON_CITY // SECTOR 07
          </div>
          <button className="p-2 glass-morphism rounded-full border border-white/10 text-white/50 hover:text-white pointer-events-auto transition-colors">
            <Info size={16} />
          </button>
        </div>

        <Avatar emotion={aura.emotion} isSpeaking={aura.isSpeaking} />

        {/* Emotion Tag */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className={`px-6 py-2 rounded-2xl glass-morphism border-2 transition-all duration-500 font-outfit font-bold uppercase tracking-[0.2em] text-sm ${EMOTION_MAP[aura.emotion]}`}>
            {aura.emotion}
          </div>
        </div>
      </div>

      {/* Chat History Panel */}
      <div className="lg:w-1/3 h-full order-3">
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
