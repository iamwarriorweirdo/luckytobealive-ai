
import React from 'react';
import { Emotion } from '../types';

interface AvatarProps {
  emotion: Emotion;
  isSpeaking: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ emotion, isSpeaking }) => {
  // Emotion-based styling
  const getGlowColor = () => {
    switch (emotion) {
      case Emotion.Happy: return 'rgba(236, 72, 153, 0.6)';
      case Emotion.Excited: return 'rgba(234, 179, 8, 0.6)';
      case Emotion.Concerned: return 'rgba(96, 165, 250, 0.6)';
      case Emotion.Thinking: return 'rgba(34, 211, 238, 0.6)';
      case Emotion.Calm: return 'rgba(52, 211, 153, 0.6)';
      default: return 'rgba(139, 92, 246, 0.6)';
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* Background Aura */}
      <div 
        className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full blur-[80px] transition-all duration-1000"
        style={{ backgroundColor: getGlowColor(), opacity: isSpeaking ? 0.4 : 0.2 }}
      />
      
      {/* Main Avatar Visual (Simplified Abstract 3D Anime Style) */}
      <div className="relative z-10 animate-float">
        <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-72 md:h-72">
          <defs>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>

          {/* Hair Back */}
          <path d="M50,120 Q30,100 40,60 Q50,20 100,20 Q150,20 160,60 Q170,100 150,120 Z" fill="url(#hairGrad)" />
          
          {/* Face */}
          <path d="M70,70 Q70,140 100,150 Q130,140 130,70 Q130,40 100,40 Q70,40 70,70 Z" fill="url(#skinGrad)" />
          
          {/* Eyes */}
          <g>
            <circle cx="85" cy="85" r="5" fill="#1e1b4b" />
            <circle cx="115" cy="85" r="5" fill="#1e1b4b" />
            {/* Highlights */}
            <circle cx="83" cy="83" r="1.5" fill="white" />
            <circle cx="113" cy="83" r="1.5" fill="white" />
          </g>

          {/* Mouth */}
          {emotion === Emotion.Happy || emotion === Emotion.Excited ? (
             <path d="M90,110 Q100,125 110,110" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
          ) : emotion === Emotion.Concerned ? (
             <path d="M90,115 Q100,105 110,115" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
          ) : (
             <path d="M95,115 L105,115" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Mouth Animation for Speaking */}
          {isSpeaking && (
            <ellipse cx="100" cy="118" rx="4" ry="6" fill="#1e1b4b">
              <animate attributeName="ry" values="2;8;2" dur="0.2s" repeatCount="indefinite" />
            </ellipse>
          )}

          {/* Hair Front Details */}
          <path d="M70,45 Q80,25 100,45 Q120,25 130,45" fill="none" stroke="#6d28d9" strokeWidth="3" />
        </svg>

        {/* Floating Interactive Elements */}
        <div className="absolute -top-4 -right-4 bg-violet-500/20 p-2 rounded-lg backdrop-blur-md border border-violet-500/30 animate-bounce">
          {emotion === Emotion.Happy && "✨"}
          {emotion === Emotion.Concerned && "💙"}
          {emotion === Emotion.Excited && "🔥"}
          {emotion === Emotion.Thinking && "🤔"}
          {emotion === Emotion.Calm && "🌿"}
          {emotion === Emotion.Neutral && "💎"}
        </div>
      </div>
    </div>
  );
};

export default Avatar;
