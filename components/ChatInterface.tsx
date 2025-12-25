
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, User, Bot, Globe, ExternalLink } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  inputValue, 
  setInputValue, 
  onSendMessage, 
  isLoading 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full glass-morphism rounded-3xl overflow-hidden border border-white/10 relative z-10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-outfit font-semibold text-white">Live Connection</h2>
        </div>
        <div className="text-xs text-violet-400 font-mono tracking-widest">AURA_v2.5_CORE</div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-violet-600' : 'bg-slate-800 border border-white/10'}`}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-violet-600 text-white rounded-tr-none' 
                  : 'glass-morphism text-slate-200 border border-white/10 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
            
            {/* Display Sources if available */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 ml-12 max-w-[85%] grid grid-cols-1 gap-1">
                <div className="text-[10px] uppercase text-white/40 font-bold mb-1 flex items-center gap-1">
                  <Globe size={10} /> Sources Verified
                </div>
                {msg.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex-1 truncate text-xs text-violet-300 group-hover:text-violet-200">{source.title}</div>
                    <ExternalLink size={10} className="text-white/30 group-hover:text-white/70" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-white/5 ml-11">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="relative flex items-center gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Aura..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none max-h-32 text-sm"
            rows={1}
          />
          <button 
            onClick={onSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white rounded-xl transition-all shadow-lg shadow-violet-900/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
