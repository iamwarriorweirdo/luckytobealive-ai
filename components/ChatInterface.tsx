
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Sparkles, Globe, User } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) return null;

  return (
    <div className="w-full h-full overflow-y-auto px-4 py-4 scrollbar-thin mask-chat-fade">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">
        {/* Spacer to push content down initially if few messages */}
        <div className="flex-1 min-h-[20vh]" /> 

        {messages.map((msg, index) => (
          <div 
            key={msg.id}
            className={`flex gap-4 animate-message ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI Avatar Icon */}
            {msg.sender === 'aura' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/80 to-purple-600/80 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 mt-1">
                <Sparkles size={16} className="text-white" />
              </div>
            )}

            <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`
                text-[15px] leading-7 font-normal tracking-wide
                ${msg.sender === 'user' 
                  ? 'bg-[#28292A] text-[#E3E3E3] px-6 py-3.5 rounded-[24px] rounded-tr-sm shadow-sm' 
                  : 'text-[#E3E3E3] px-1 py-1' // AI text blends with background
                }
              `}>
                {msg.text}
              </div>
              
              {/* Sources Chips for AI */}
              {msg.sender === 'aura' && msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 ml-1">
                  {msg.sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" className="group flex items-center gap-2 bg-[#1E1F20] border border-white/10 px-3 py-1.5 rounded-full text-xs hover:bg-[#2D2E30] transition-colors">
                          <Globe size={12} className="text-blue-400" />
                          <span className="max-w-[150px] truncate text-gray-400 group-hover:text-gray-200 transition-colors">{s.title}</span>
                      </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/50 to-purple-600/50 flex items-center justify-center shrink-0 mt-1">
              <Sparkles size={16} className="text-white/80" />
            </div>
            <div className="flex items-center gap-1.5 mt-3">
               <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }} />
               <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
               <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};

export default ChatInterface;
