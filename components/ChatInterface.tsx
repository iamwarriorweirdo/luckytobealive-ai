
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Sparkles, Globe, ExternalLink } from 'lucide-react';

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
    <div className="w-full h-full overflow-y-auto px-4 py-6 scrollbar-none mask-image-gradient">
        <div className="flex flex-col gap-4 mt-auto min-h-0 justify-end pb-4">
          {messages.map((msg, index) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-message`}
            >
              <div className={`
                px-4 py-2.5 max-w-[85%] text-sm font-medium backdrop-blur-md shadow-sm border border-white/5
                ${msg.sender === 'user' 
                  ? 'bg-white/10 text-white rounded-[20px] rounded-tr-sm' 
                  : 'bg-black/40 text-gray-100 rounded-[20px] rounded-tl-sm'
                }
              `}>
                {msg.text}
                
                {/* Sources Mini Chips */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px] hover:bg-white/20">
                            <Globe size={10} />
                            <span className="max-w-[100px] truncate">{s.title}</span>
                        </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start px-4 py-2 bg-black/40 backdrop-blur-md rounded-full flex gap-1 items-center border border-white/5">
                <Sparkles size={12} className="text-violet-400 animate-pulse" />
                <span className="text-xs text-violet-200">Thinking...</span>
            </div>
          )}
          
          <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatInterface;
