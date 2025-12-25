'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, Emotion } from '@/types';
import ChatInterface from '@/components/ChatInterface';
import AdminPanel from '@/components/AdminPanel';
import Experience from '@/components/Experience';
import { useStore } from '@/store';
import { useAIBrain } from '@/hooks/useAIBrain';
import { Mic, MicOff, Heart, ShieldCheck, Video, VideoOff, Eye, Settings } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Custom Hook for AI Logic
  const { chatText, connectLiveVoice, disconnectLiveVoice, isLoading, sessionRef } = useAIBrain();

  const { 
    isCameraActive, setIsCameraActive,
    toggleAdmin, addLog, setIsSpeaking
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoIntervalRef = useRef<any>(null);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      sender: 'aura',
      text: "Xin chào Companion. Hệ thống Next.js Core đã kích hoạt. Tôi sẵn sàng nhận JSON lệnh.",
      timestamp: new Date(),
      emotion: Emotion.Calm
    }]);
  }, []);

  // --- Camera Logic (Giữ nguyên từ App.tsx cũ nhưng làm gọn) ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (isCameraActive && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
        } catch (e: any) {
          setIsCameraActive(false);
          addLog('error', `Camera Error: ${e.message}`);
        }
      }
    };
    if (isCameraActive) startCamera();
    else if (stream) (stream as MediaStream).getTracks().forEach(track => track.stop());
    return () => { if (stream) (stream as MediaStream).getTracks().forEach(track => track.stop()); };
  }, [isCameraActive, setIsCameraActive, addLog]);

  // --- Vision Streaming Logic ---
  useEffect(() => {
      if (isVoiceActive && isCameraActive && sessionRef.current) {
        // Logic gửi frame video qua Live session (Mockup logic integration)
        // Trong Next.js hook đã handle sessionRef
      }
  }, [isVoiceActive, isCameraActive, sessionRef]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // UI Update immediate
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Call AI Hook
    const responseMsg = await chatText(inputValue);
    if (responseMsg) {
        setMessages(prev => [...prev, responseMsg]);
    }
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
        disconnectLiveVoice();
        setIsVoiceActive(false);
    } else {
        try {
            await connectLiveVoice(setIsSpeaking);
            setIsVoiceActive(true);
        } catch(e) {
            // Error handled in hook
        }
    }
  };

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full premium-gradient text-white p-4 gap-6 overflow-hidden relative">
      <AdminPanel />
      
      {/* Hidden Vision Elements */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* LEFT SIDEBAR */}
      <div className="lg:w-80 flex flex-col gap-4 order-2 lg:order-1 shrink-0">
        <div className="glass-morphism p-8 rounded-[40px] space-y-8 border border-white/10 h-full overflow-y-auto relative">
            <div className="space-y-1">
                <h1 className="font-outfit font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-300">
                luckytobealive.AI
                </h1>
                <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Arch: Next.js App Router</p>
            </div>
            
            {/* Stats & Camera Preview Area */}
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-white/50 flex items-center gap-2">
                    <Heart size={14} className="text-rose-500" /> BRAIN SYNC
                    </span>
                    <span className="text-sm font-bold text-violet-400">Stable</span>
                </div>
                 {/* Camera Preview Box */}
                 <div className={`aspect-video rounded-2xl overflow-hidden border border-white/10 relative transition-all duration-500 ${isCameraActive ? 'bg-black' : 'bg-white/5 flex items-center justify-center'}`}>
                    {isCameraActive ? (
                        <video 
                        ref={(node) => { if (node && videoRef.current) node.srcObject = videoRef.current.srcObject; }} 
                        autoPlay muted className="w-full h-full object-cover mirror-mode" 
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-white/20"><Eye size={24} /></div>
                    )}
                </div>
            </div>
            
            {/* Control Buttons Group */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
                 <div onClick={toggleAdmin} className="glass-morphism p-4 rounded-2xl cursor-pointer hover:bg-white/5 group">
                    <Settings size={18} className="text-white/50 mb-2 group-hover:text-white" />
                    <div className="text-[10px] text-white/40 uppercase font-bold">Config</div>
                </div>
                <div className="glass-morphism p-4 rounded-2xl">
                    <ShieldCheck size={18} className="text-emerald-400 mb-2" />
                    <div className="text-[10px] text-white/40 uppercase font-bold">Secure</div>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={toggleVoice} className={`flex-1 py-5 rounded-[32px] flex items-center justify-center gap-2 font-outfit font-extrabold transition-all ${isVoiceActive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/50' : 'bg-white text-black'}`}>
            {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
            {isVoiceActive ? 'END' : 'LINK'}
          </button>
          <button onClick={() => setIsCameraActive(!isCameraActive)} className={`w-20 rounded-[32px] flex items-center justify-center transition-all ${isCameraActive ? 'bg-emerald-500/20 text-emerald-400' : 'glass-morphism text-white/50'}`}>
            {isCameraActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
      </div>

      {/* CENTER: 3D EXPERIENCE */}
      <Experience />

      {/* RIGHT: CHAT INTERFACE */}
      <div className="lg:w-96 h-full order-3 shrink-0">
        <ChatInterface 
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}