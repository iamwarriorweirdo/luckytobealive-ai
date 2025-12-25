
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

// Fix for JSX intrinsic elements
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const Primitive = 'primitive' as any;

/**
 * Component hiển thị Model Anime.
 * Để sử dụng model của riêng bạn:
 * 1. Tải file .glb (ví dụ từ Vroid hoặc Sketchfab).
 * 2. Đổi tên thành 'model.glb'.
 * 3. Copy vào thư mục 'public/' của dự án Next.js.
 */
const AnimeModel = () => {
  const { currentAnimation, isSpeaking } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  
  // State để xử lý việc load model
  const [modelError, setModelError] = useState(false);
  
  let scene: THREE.Group | null = null;
  
  try {
    // Cố gắng load file model.glb từ thư mục public
    // Nếu bạn chưa có file này, nó sẽ nhảy vào catch/error boundary (hoặc console error)
    // Chúng ta dùng cơ chế try/catch giả lập ở đây hoặc check file tồn tại (khó ở client side thuần)
    // React Three Fiber useGLTF sẽ throw error nếu 404.
    const gltf = useGLTF('/model.glb', true); // true = useDraco
    scene = gltf.scene;
  } catch (e) {
    // Nếu không tìm thấy file model.glb, render placeholder
    // console.warn("Không tìm thấy /model.glb, sử dụng Placeholder.");
  }

  // Animation Logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      // 1. SPIN EFFECT
      if (currentAnimation === 'SPIN') {
        groupRef.current.rotation.y += delta * 5;
      } else {
        // Quay về góc chính diện từ từ
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2);
      }

      // 2. BOUNCE WHEN TALKING
      if (isSpeaking) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 10) * 0.02 - 1.5;
      } else {
         // Breathing idle
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.02 - 1.5;
      }
    }
  });

  if (!scene || modelError) {
    return <PlaceholderModel groupRef={groupRef} isSpeaking={isSpeaking} />;
  }

  return (
    <Primitive 
      ref={groupRef} 
      object={scene} 
      scale={2.5} 
      position={[0, -2, 0]} 
      onError={() => setModelError(true)}
    />
  );
};

// Fallback Model (Hình nhân cách điệu) nếu chưa có file .glb
const PlaceholderModel = ({ groupRef, isSpeaking }: { groupRef: any, isSpeaking: boolean }) => {
  return (
    <Group ref={groupRef} position={[0, -1, 0]}>
       <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          {/* Head */}
          <Mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color={isSpeaking ? "#ffb7b2" : "#e0e0e0"} roughness={0.3} />
          </Mesh>
          {/* Eyes */}
          <Mesh position={[-0.12, 1.65, 0.28]}>
             <sphereGeometry args={[0.08, 16, 16]} />
             <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
          </Mesh>
          <Mesh position={[0.12, 1.65, 0.28]}>
             <sphereGeometry args={[0.08, 16, 16]} />
             <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
          </Mesh>
          
          {/* Body */}
          <Mesh position={[0, 0.8, 0]}>
            <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
            <meshStandardMaterial color="#1e1e20" roughness={0.5} metalness={0.8} />
          </Mesh>

          {/* Arms (Decor) */}
          <Mesh position={[-0.45, 1, 0]} rotation={[0, 0, 0.2]}>
             <capsuleGeometry args={[0.08, 0.8]} />
             <meshStandardMaterial color="#333" />
          </Mesh>
          <Mesh position={[0.45, 1, 0]} rotation={[0, 0, -0.2]}>
             <capsuleGeometry args={[0.08, 0.8]} />
             <meshStandardMaterial color="#333" />
          </Mesh>

          <Html position={[0, 2.2, 0]} center>
             <div className="bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md whitespace-nowrap border border-white/10">
                Put 'model.glb' in public folder
             </div>
          </Html>
       </Float>
    </Group>
  );
}

const Avatar: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [0, 0.5, 3.5], fov: 45 }}>
        {/* Ánh sáng chuẩn Studio cho Anime */}
        <ambientLight intensity={0.8} />
        <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={1.5} castShadow />
        <spotLight position={[-5, 5, 5]} angle={0.5} penumbra={1} intensity={1} color="#a78bfa" />
        <pointLight position={[0, 0, 2]} intensity={0.5} color="#fff" />
        
        {/* Render Model */}
        <React.Suspense fallback={null}>
            <AnimeModel />
            <Environment preset="city" />
        </React.Suspense>

        <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} />
        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.8} // Giới hạn góc nhìn xuống
            minPolarAngle={Math.PI / 2.5} 
            minDistance={2}
            maxDistance={6}
        />
      </Canvas>
    </div>
  );
};

export default Avatar;
