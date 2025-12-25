'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, Emotion } from '../types';
import ChatInterface from '../components/ChatInterface';
import AdminPanel from '../components/AdminPanel';
import Experience from '../components/Experience';
import { useStore } from '../store';
import { useAIBrain } from '../hooks/useAIBrain';
import { Mic, MicOff, Heart, ShieldCheck, Video, VideoOff, Eye, Settings, Globe } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
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
      text: "Xin chào. Tôi là luckytobealive.AI. Hệ thống thị giác và nhận thức đã sẵn sàng trên nền tảng Web.",
      timestamp: new Date(),
      emotion: Emotion.Calm
    }]);
  }, []);

  // --- Camera Logic ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (isCameraActive && videoRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            addLog('info', 'Camera feed acquired');
          }
        } catch (e: any) {
          setIsCameraActive(false);
          addLog('error', `Camera Access Denied: ${e.message}`);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'aura',
            text: "Tôi không thể truy cập camera của bạn. Hãy kiểm tra quyền truy cập trình duyệt.",
            timestamp: new Date(),
            emotion: Emotion.Concerned
          }]);
        }
      }
    };
    if (isCameraActive) startCamera();
    else if (stream) (stream as MediaStream).getTracks().forEach(track => track.stop());
    return () => { if (stream) (stream as MediaStream).getTracks().forEach(track => track.stop()); };
  }, [isCameraActive, setIsCameraActive, addLog]);

  // --- Vision Streaming to Live API ---
  useEffect(() => {
    if (isVoiceActive && isCameraActive && sessionRef.current) {
      videoIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current && sessionRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
             canvasRef.current.width = videoRef.current.videoWidth;
             canvasRef.current.height = videoRef.current.videoHeight;
             ctx.drawImage(videoRef.current, 0, 0);
             const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
             
             sessionRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data }});
             });
          }
        }
      }, 500); 
    }
    return () => clearInterval(videoIntervalRef.current);
  }, [isVoiceActive, isCameraActive, sessionRef]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

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
             // Handled in hook
             setIsVoiceActive(false);
        }
    }
  };

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full premium-gradient text-white p-4 gap-6 overflow-hidden relative font-inter">
      <AdminPanel />
      
      {/* Hidden Elements */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* LEFT SIDEBAR */}
      <div className="lg:w-80 flex flex-col gap-4 order-2 lg:order-1 shrink-0">
        <div className="glass-morphism p-8 rounded-[40px] space-y-8 border border-white/10 h-full overflow-y-auto relative flex flex-col">
            <div className="space-y-1">
                <h1 className="font-outfit font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-300">
                luckytobealive.AI
                </h1>
                <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Web Interface V2.0</p>
            </div>
            
            <div className="space-y-6">
                 {/* Connection Status */}
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-white/50 flex items-center gap-2">
                    <Globe size={14} className="text-cyan-500" /> GLOBAL_SYNC
                    </span>
                    <span className="text-sm font-bold text-violet-400 animate-pulse">Connected</span>
                </div>

                 {/* Camera Preview Box */}
                 <div className={`aspect-video rounded-2xl overflow-hidden border border-white/10 relative transition-all duration-500 ${isCameraActive ? 'bg-black shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 flex items-center justify-center'}`}>
                    {isCameraActive ? (
                        <>
                            <video 
                            ref={(node) => { if (node && videoRef.current) node.srcObject = videoRef.current.srcObject; }} 
                            autoPlay muted className="w-full h-full object-cover mirror-mode" 
                            />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-white/20">
                            <Eye size={24} />
                            <span className="text-[10px] uppercase tracking-wider">Vision Offline</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-3">
                 <div onClick={toggleAdmin} className="glass-morphism p-4 rounded-2xl cursor-pointer hover:bg-white/5 group border border-white/5 transition-all">
                    <Settings size={18} className="text-white/50 mb-2 group-hover:text-white group-hover:rotate-90 transition-transform" />
                    <div className="text-[10px] text-white/40 uppercase font-bold">System</div>
                </div>
                <div className="glass-morphism p-4 rounded-2xl border border-white/5">
                    <ShieldCheck size={18} className="text-emerald-400 mb-2" />
                    <div className="text-[10px] text-white/40 uppercase font-bold">Secure</div>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={toggleVoice} className={`flex-1 py-5 rounded-[32px] flex items-center justify-center gap-2 font-outfit font-extrabold transition-all duration-300 shadow-xl ${isVoiceActive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/50 shadow-rose-900/20' : 'bg-white text-black hover:scale-[0.98]'}`}>
            {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
            {isVoiceActive ? 'TERMINATE' : 'INITIALIZE'}
          </button>
          <button onClick={() => setIsCameraActive(!isCameraActive)} className={`w-20 rounded-[32px] flex items-center justify-center transition-all duration-300 ${isCameraActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'glass-morphism text-white/50 border border-white/10 hover:bg-white/10'}`}>
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