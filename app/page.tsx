
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import ChatInterface from '../components/ChatInterface';
import AdminPanel from '../components/AdminPanel';
import Experience from '../components/Experience';
import { useStore } from '../store';
import { useAIBrain } from '../hooks/useAIBrain';
import { 
  Mic, Square, Send, Video, VideoOff, 
  Menu, Sparkles, Camera, Compass, 
  Music, Repeat
} from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  const { chatText, connectLiveVoice, disconnectLiveVoice, isLoading, sessionRef } = useAIBrain();

  const { 
    isCameraActive, setIsCameraActive,
    toggleAdmin, setIsSpeaking, 
    setAnimation
  } = useStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <main className="h-screen w-full bg-[#131314] overflow-hidden relative font-outfit text-[#E3E3E3]">
      <AdminPanel />

      {/* 1. LAYER 3D MODEL (Nằm nền) */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${messages.length > 0 ? 'opacity-80' : 'opacity-100'}`}>
        <Experience />
      </div>

      {/* 2. LAYER UI INTERFACE */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* Top Header */}
        <div className="flex justify-between items-center p-6 pointer-events-auto">
          <div className="flex items-center gap-3">
            <button onClick={toggleAdmin} className="p-2 text-gray-400 hover:text-white transition-colors">
                <Menu size={24} />
            </button>
            <span className="font-medium text-lg tracking-tight text-white/90">Gemini Live 3D</span>
          </div>

          {/* Camera Widget */}
          <div className="flex items-center gap-2">
             {isCameraActive && (
               <div className="w-24 h-16 bg-black rounded-lg border border-white/10 overflow-hidden relative shadow-lg">
                  <video ref={videoRef} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </div>
             )}
             <button 
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`p-2.5 rounded-full transition-all border ${isCameraActive ? 'bg-[#1E1E20] border-emerald-500/50 text-emerald-400' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5'}`}
             >
                {isCameraActive ? <Video size={20} /> : <VideoOff size={20} />}
             </button>
          </div>
        </div>

        {/* Center Chat Area */}
        <div className="flex-1 min-h-0 relative flex justify-center">
            {/* Nếu chưa có tin nhắn, hiển thị Welcome */}
            {messages.length === 0 && (
                <div className="self-center text-center space-y-4 pointer-events-none mt-[-10vh]">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 mb-4 backdrop-blur-sm">
                        <Sparkles size={32} className="text-white/80" />
                    </div>
                    <h1 className="text-4xl font-normal bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60">
                        Hello, Human.
                    </h1>
                    <p className="text-lg text-white/40 font-light">
                        I can help you create, learn, and explore.
                    </p>
                </div>
            )}
            
            {/* Chat List */}
            <div className="w-full h-full max-w-4xl pointer-events-auto">
               <ChatInterface messages={messages} isLoading={isLoading} />
            </div>
        </div>

        {/* Bottom Input Area */}
        <div className="w-full p-6 pb-8 pointer-events-auto flex flex-col items-center justify-end bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent">
           
           {/* Suggestion Chips */}
           {messages.length === 0 && (
             <div className="flex gap-3 mb-6 overflow-x-auto w-full max-w-2xl justify-center scrollbar-none opacity-0 animate-[fadeIn_0.5s_ease-out_0.5s_forwards]">
                <button onClick={() => setAnimation('SPIN')} className="flex items-center gap-2 px-4 py-2 bg-[#1E1F20] hover:bg-[#2D2E30] border border-white/5 rounded-xl transition-all text-sm text-gray-300">
                   <Repeat size={14} className="text-purple-400" />
                   <span>Spin around</span>
                </button>
                <button onClick={() => setInputValue('Tell me a story about space')} className="flex items-center gap-2 px-4 py-2 bg-[#1E1F20] hover:bg-[#2D2E30] border border-white/5 rounded-xl transition-all text-sm text-gray-300">
                   <Compass size={14} className="text-blue-400" />
                   <span>Tell a story</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1E1F20] hover:bg-[#2D2E30] border border-white/5 rounded-xl transition-all text-sm text-gray-300">
                   <Music size={14} className="text-amber-400" />
                   <span>Play Jazz</span>
                </button>
             </div>
           )}

           {/* Input Bar Container */}
           <div className="relative w-full max-w-3xl group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-[#1E1F20] rounded-[32px] border border-white/10 flex items-center p-2 pr-3 shadow-2xl transition-all focus-within:border-white/20 focus-within:bg-[#252627]">
                 
                 {/* Main Input */}
                 <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Aura anything..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-6 py-3 text-base h-12"
                 />
                 
                 {/* Right Actions */}
                 <div className="flex items-center gap-2">
                    {inputValue.trim() ? (
                        <button onClick={handleSendMessage} className="p-2.5 rounded-full bg-white text-black hover:bg-gray-200 transition-colors">
                            <Send size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={toggleVoice}
                            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${isVoiceActive ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'hover:bg-white/10 text-white/70'}`}
                        >
                            {isVoiceActive ? <Square size={18} fill="currentColor" className="animate-pulse" /> : <Mic size={22} />}
                        </button>
                    )}
                 </div>
              </div>
              
              {/* Voice Status Text */}
              {isVoiceActive && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-medium text-white/60 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/5">
                      Listening...
                  </div>
              )}
           </div>

           <div className="mt-4 text-[10px] text-white/30 font-medium">
              Aura can make mistakes. Check important info.
           </div>

        </div>
      </div>
    </main>
  );
}
