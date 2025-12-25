
import React, { useState, useEffect, useRef } from 'react';
import { Message, Emotion, AnimationType } from './types';
import Avatar from './components/Avatar';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import { chatWithAura, decode, decodeAudioData, encode } from './services/geminiService';
import { useStore } from './store';
import { Mic, MicOff, Heart, Box, ShieldCheck, Video, VideoOff, Eye, Settings } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Zustand Store
  const { 
    currentAnimation, setAnimation, setEmotion, setIsSpeaking, isSpeaking, 
    isCameraActive, setIsCameraActive,
    toggleAdmin, customSystemInstruction, addLog
  } = useStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  
  // Video & Canvas Refs for Vision
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      sender: 'aura',
      text: "Xin chào Companion. Hệ thống thị giác và thính giác luckytobealive.AI đã sẵn sàng. Hãy bật Camera để tôi có thể nhìn thấy cảm xúc của bạn.",
      timestamp: new Date(),
      emotion: Emotion.Calm
    }]);
    addLog('info', 'System initialized. Ready for user interaction.');
  }, []);

  // Effect to handle Camera Stream logic with Robust Error Handling
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (isCameraActive && videoRef.current) {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser does not support camera access.");
          }

          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            addLog('info', 'Camera started successfully.');
          }
        } catch (e: any) {
          console.error("Camera access failed:", e);
          setIsCameraActive(false); // Auto turn off
          
          // Friendly Error Handling
          let userMessage = "Không thể truy cập camera.";
          if (e.name === 'NotFoundError' || e.message?.includes("device not found") || e.message?.includes("Requested device not found")) {
            userMessage = "Không tìm thấy thiết bị Camera. Hãy đảm bảo bạn đã kết nối webcam.";
          } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            userMessage = "Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.";
          }
          
          addLog('error', `Camera Error: ${e.message}`);
          
          // Send System Alert to Chat
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'aura',
            text: `[SYSTEM ALERT] ${userMessage}`,
            timestamp: new Date(),
            emotion: Emotion.Concerned
          }]);
        }
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        addLog('info', 'Camera stopped.');
      }
    };

    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isCameraActive, setIsCameraActive, addLog]);

  // Effect to send Video Frames to Gemini Live
  useEffect(() => {
    if (isVoiceActive && isCameraActive && sessionRef.current) {
      videoIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current && sessionRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d');
          
          if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 jpeg
            const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
            
            // Send frame
            sessionRef.current.sendRealtimeInput({
              media: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            });
          }
        }
      }, 500); 
    }

    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isVoiceActive, isCameraActive]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setAnimation('THINKING');
    addLog('info', `User sent message: "${inputValue.substring(0, 20)}..."`);

    try {
      const data = await chatWithAura(inputValue, customSystemInstruction, addLog);
      
      setAnimation(data.animation as AnimationType);
      setEmotion(data.emotion as Emotion);

      const auraMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'aura',
        text: data.text,
        timestamp: new Date(),
        emotion: data.emotion as Emotion,
        sources: data.sources // Pass sources to UI
      };

      setMessages(prev => [...prev, auraMsg]);
      setIsSpeaking(true);
      setTimeout(() => { setIsSpeaking(false); setAnimation('IDLE'); }, 3000);

    } catch (error) {
      console.error(error);
      addLog('error', 'Failed to generate response.');
      setAnimation('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      if (sessionRef.current) sessionRef.current = null;
      addLog('info', 'Voice session ended.');
      return;
    }

    try {
      setIsVoiceActive(true);
      addLog('info', 'Initializing voice session...');
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
            addLog('info', 'Voice session connected.');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
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
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.onended = () => {
                if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
                  setIsSpeaking(false);
                  setAnimation('IDLE');
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
          },
          onerror: (e) => { 
            console.error(e); 
            addLog('error', 'Voice session error.');
            setIsVoiceActive(false); 
          },
          onclose: () => {
            addLog('info', 'Voice session closed.');
            setIsVoiceActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: customSystemInstruction
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      addLog('error', 'Failed to start voice session.');
      setIsVoiceActive(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full premium-gradient text-white p-4 gap-6 overflow-hidden relative">
      <AdminPanel />
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* Sidebar Brand */}
      <div className="lg:w-80 flex flex-col gap-4 order-2 lg:order-1 shrink-0">
        <div className="glass-morphism p-8 rounded-[40px] space-y-8 border border-white/10 h-full overflow-y-auto relative">
          <div className="space-y-1">
            <h1 className="font-outfit font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-300">
              luckytobealive.AI
            </h1>
            <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Protocol: Multimodal_V3</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-medium text-white/50 flex items-center gap-2">
                  <Heart size={14} className="text-rose-500" /> BRAIN SYNC
                </span>
                <span className="text-sm font-bold text-violet-400">99.9%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 w-[99.9%]" />
              </div>
            </div>

            {/* User Vision Preview */}
            <div className={`aspect-video rounded-2xl overflow-hidden border border-white/10 relative transition-all duration-500 ${isCameraActive ? 'bg-black' : 'bg-white/5 flex items-center justify-center'}`}>
              {isCameraActive ? (
                <>
                  <video 
                    ref={(node) => {
                      if (node && videoRef.current && node !== videoRef.current) {
                        node.srcObject = videoRef.current.srcObject;
                      }
                    }} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover mirror-mode transform -scale-x-100" 
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-emerald-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">Vision ON</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/20">
                  <Eye size={24} />
                  <span className="text-[10px] font-mono uppercase">Vision Offline</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-morphism p-4 rounded-2xl border border-white/5">
                <ShieldCheck size={18} className="text-emerald-400 mb-2" />
                <div className="text-[10px] text-white/40 uppercase font-bold">Privacy</div>
                <div className="text-xs font-bold">Encrypted</div>
              </div>
              <div 
                onClick={toggleAdmin}
                className="glass-morphism p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <Settings size={18} className="text-white/50 mb-2 group-hover:text-white group-hover:rotate-90 transition-all" />
                <div className="text-[10px] text-white/40 uppercase font-bold">Admin</div>
                <div className="text-xs font-bold">Command Ctr</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button 
            onClick={toggleVoice}
            className={`flex-1 py-5 rounded-[32px] flex items-center justify-center gap-2 font-outfit font-extrabold transition-all duration-500 ${
              isVoiceActive 
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]' 
                : 'bg-white text-black hover:scale-[0.98]'
            }`}
          >
            {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
            {isVoiceActive ? 'END' : 'LINK'}
          </button>

          <button 
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`w-20 rounded-[32px] flex items-center justify-center transition-all duration-300 ${
              isCameraActive 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                : 'glass-morphism text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            {isCameraActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
      </div>

      {/* Main Avatar 3D Display */}
      <div className="flex-1 relative order-1 lg:order-2 flex items-center justify-center bg-[#070709] rounded-[48px] border border-white/5 overflow-hidden">
        <Avatar />

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
          <div className="px-8 py-3 rounded-full glass-morphism border-2 border-white/10 font-outfit font-black uppercase tracking-[0.3em] text-[10px] text-white/50">
            STATUS: {currentAnimation}
          </div>
          <div className="text-[10px] text-white/20 font-mono tracking-widest flex items-center gap-2">
            <span className={`w-1 h-1 rounded-full ${isSpeaking ? 'bg-green-500 animate-ping' : 'bg-white/20'}`} />
            REALTIME_INTERACTION_V3
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
