import React from 'react';
import Avatar from './Avatar';

const Experience: React.FC = () => {
  return (
    <div className="flex-1 relative order-1 lg:order-2 flex items-center justify-center bg-[#070709] rounded-[48px] border border-white/5 overflow-hidden">
      <Avatar />
      
      {/* Overlay Status (Có thể tách thành UI component riêng) */}
      <StatusOverlay />
    </div>
  );
};

// Component con để hiển thị trạng thái, dùng useStore nội bộ
import { useStore } from '@/store';
const StatusOverlay = () => {
    const { currentAnimation, isSpeaking } = useStore();
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none">
          <div className="px-8 py-3 rounded-full glass-morphism border-2 border-white/10 font-outfit font-black uppercase tracking-[0.3em] text-[10px] text-white/50">
            STATUS: {currentAnimation}
          </div>
          <div className="text-[10px] text-white/20 font-mono tracking-widest flex items-center gap-2">
            <span className={`w-1 h-1 rounded-full ${isSpeaking ? 'bg-green-500 animate-ping' : 'bg-white/20'}`} />
            REALTIME_INTERACTION_V3
          </div>
        </div>
    )
}

export default Experience;