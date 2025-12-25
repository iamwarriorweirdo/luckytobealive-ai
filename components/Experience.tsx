'use client';

import React from 'react';
import Avatar from './Avatar';
import { useStore } from '../store';

const Experience: React.FC = () => {
  // Chúng ta giữ Avatar đơn giản, loại bỏ các overlay rườm rà để giống Gemini Live hơn
  return (
    <div className="w-full h-full relative">
      <Avatar />
      {/* Gradient fade ở dưới chân để hòa vào giao diện chat nếu cần */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#131314] to-transparent pointer-events-none" />
    </div>
  );
};

export default Experience;