
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

// Fix for JSX intrinsic element errors in Three.js/R3F environment
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const MeshBasicMaterial = 'meshBasicMaterial' as any;
const AmbientLight = 'ambientLight' as any;
const SpotLight = 'spotLight' as any;
const PointLight = 'pointLight' as any;

const CharacterModel = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { currentAnimation, isSpeaking } = useStore();

  // Hiệu ứng "nhịp thở" và chuyển động dựa trên hoạt ảnh
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Idle movement
      meshRef.current.position.y = Math.sin(t) * 0.1;
      
      if (currentAnimation === 'TALK' || isSpeaking) {
        meshRef.current.scale.setScalar(1 + Math.sin(t * 15) * 0.05);
      } else if (currentAnimation === 'WAVE') {
        meshRef.current.rotation.z = Math.sin(t * 5) * 0.2;
      } else {
        meshRef.current.scale.setScalar(1);
        meshRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <Group>
      {/* 
        LƯU Ý: Đây là một mẫu hình khối 3D trừu tượng. 
        Để dùng nhân vật anime thực, bạn hãy dùng: 
        const { scene } = useGLTF('/path/to/your/model.glb') 
        và thay thế phần Mesh bên dưới bằng <primitive object={scene} />
      */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
          <MeshDistortMaterial
            color={isSpeaking ? "#a855f7" : "#6366f1"}
            speed={2}
            distort={0.4}
            radius={1}
          />
        </Sphere>
      </Float>
      
      {/* Giả lập đôi mắt phát sáng */}
      <Mesh position={[-0.4, 0.2, 1.2]}>
        <SphereGeometry args={[0.1, 16, 16]} />
        <MeshBasicMaterial color="#fff" />
      </Mesh>
      <Mesh position={[0.4, 0.2, 1.2]}>
        <SphereGeometry args={[0.1, 16, 16]} />
        <MeshBasicMaterial color="#fff" />
      </Mesh>
    </Group>
  );
};

const Avatar: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <AmbientLight intensity={0.5} />
        <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <PointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <CharacterModel />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
};

export default Avatar;
