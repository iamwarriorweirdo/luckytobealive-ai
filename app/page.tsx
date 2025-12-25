
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import ChatInterface from '../components/ChatInterface';
import AdminPanel from '../components/AdminPanel';
import Experience from '../components/Experience';
import { useStore } from '../store';
import { useAIBrain } from '../hooks/useAIBrain';
import { 
  Mic, MicOff, Send, Video, VideoOff, 
  Menu, Square, Sparkles, Camera, MapPin, 
  RotateCw, Music, StopCircle
} from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  const { chatText, connectLiveVoice, disconnectLiveVoice, isLoading, sessionRef } = useAIBrain();

  const { 
    isCameraActive, setIsCameraActive,
    toggleAdmin, addLog, setIsSpeaking, 
    setAnimation, currentAnimation
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoIntervalRef = useRef<any>(null);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    const responseMsg = await chatText(inputValue);
    if (responseMsg) setMessages(prev => [...prev, responseMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
             setIsVoiceActive(false);
        }
    }
  };

  // --- Mock Vision Logic (Giữ nguyên) ---
  useEffect(() => {
    // (Logic camera cũ giữ nguyên, đã lược bỏ để tập trung UI)
    // Nếu muốn bật lại camera thật, hãy uncomment logic getUserMedia ở phiên bản trước
  }, [isCameraActive]);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative font-outfit text-white">
      <AdminPanel />

      {/* 1. BACKGROUND LAYER: 3D EXPERIENCE */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 to-black">
        <Experience />
      </div>

      {/* 2. OVERLAY UI LAYER */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pointer-events-auto">
          <button onClick={toggleAdmin} className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full border border-white/5 transition-colors">
            <Menu size={24} />
          </button>

          {/* Camera Capture UI (Giả lập) */}
          {isCameraActive && (
            <div className="w-32 h-44 bg-black/80 rounded-xl border border-white/10 overflow-hidden relative shadow-2xl">
               <div className="absolute top-2 right-2 z-10 flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
               </div>
               <video ref={videoRef} className="w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">Vision Active</span>
               </div>
            </div>
          )}
          
          {!isCameraActive && (
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full border border-white/5 text-sm font-medium">
                <Camera size={16} />
                <span>Capture</span>
             </button>
          )}
        </div>

        {/* Middle Area (Empty for Character View) */}
        <div className="flex-1 min-h-0 relative">
            {/* Chat History Overlay (Nổi nhẹ bên trái hoặc dưới) */}
            <div className="absolute bottom-0 left-0 w-full h-[60%] pointer-events-auto mask-image-top-fade">
               <ChatInterface messages={messages} isLoading={isLoading} />
            </div>
        </div>

        {/* Bottom Controls Area */}
        <div className="p-6 pb-8 space-y-4 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent">
           
           {/* Action Chips */}
           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              <button onClick={() => setAnimation('SPIN')} className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1E22] hover:bg-[#2A2A30] rounded-full border border-white/5 transition-all text-sm whitespace-nowrap">
                 <RotateCw size={14} className="text-violet-400" />
                 <span>Spin</span>
              </button>
              <button onClick={() => alert("Go to Jazz Bar (Demo)")} className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1E22] hover:bg-[#2A2A30] rounded-full border border-white/5 transition-all text-sm whitespace-nowrap">
                 <Music size={14} className="text-amber-400" />
                 <span>Jazz bar</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1E22] hover:bg-[#2A2A30] rounded-full border border-white/5 transition-all text-sm whitespace-nowrap">
                 <Sparkles size={14} className="text-cyan-400" />
                 <span>Watch stars</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1E22] hover:bg-[#2A2A30] rounded-full border border-white/5 transition-all text-sm whitespace-nowrap">
                 <MapPin size={14} className="text-emerald-400" />
                 <span>Go to</span>
              </button>
           </div>

           {/* Main Input Bar */}
           <div className="flex items-center gap-2">
              {/* Vision Toggle */}
              <button 
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`h-14 w-14 rounded-[20px] flex items-center justify-center transition-all ${isCameraActive ? 'bg-white text-black' : 'bg-[#1E1E22] text-gray-400 hover:text-white'}`}
              >
                 {isCameraActive ? <Video size={24} /> : <VideoOff size={24} />}
              </button>

              {/* Chat Input Pill */}
              <div className="flex-1 h-14 bg-[#1E1E22]/80 backdrop-blur-xl border border-white/5 rounded-[24px] flex items-center px-2 shadow-xl">
                 <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Anything..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-4"
                 />
                 
                 {inputValue.trim() ? (
                    <button onClick={handleSendMessage} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black mr-1">
                        <Send size={18} className="ml-1" />
                    </button>
                 ) : (
                    <button 
                        onClick={toggleVoice}
                        className={`h-10 w-10 rounded-full flex items-center justify-center transition-all mr-1 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-gray-400 hover:bg-white/10'}`}
                    >
                        {isVoiceActive ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
                    </button>
                 )}
              </div>

              {/* Audio Toggle / Stop */}
              {isVoiceActive ? (
                 <button onClick={disconnectLiveVoice} className="h-14 w-14 rounded-[20px] bg-[#1E1E22] flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                    <StopCircle size={24} />
                 </button>
              ) : (
                <div className="h-14 w-14 rounded-[20px] bg-[#1E1E22] flex items-center justify-center text-gray-500">
                    <div className="flex gap-0.5 items-end h-4">
                        <div className="w-1 bg-gray-500 h-2 rounded-full" />
                        <div className="w-1 bg-gray-500 h-4 rounded-full" />
                        <div className="w-1 bg-gray-500 h-3 rounded-full" />
                    </div>
                </div>
              )}
           </div>

        </div>
      </div>
    </main>
  );
}
