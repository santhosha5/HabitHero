import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';

interface ParticleSystemProps {
  count: number;
  color: string;
  size?: number;
  radius?: number;
}

export default function ParticleSystem({ 
  count = 100, 
  color = '#ffffff', 
  size = 0.02, 
  radius = 1 
}: ParticleSystemProps) {
  const particles = useMemo(() => {
    const temp = [];
    // Golden ratio for more even distribution
    const phi = (1 + Math.sqrt(5)) / 2;
    
    for (let i = 0; i < count; i++) {
      // Use fibonacci sphere distribution for better particle placement
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      
      const theta = 2 * Math.PI * i * phi;
      
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      
      // Scale by radius
      temp.push([x * radius, y * radius, z * radius]);
    }
    return temp;
  }, [count, radius]);

  return (
    <Instances limit={count}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      {particles.map((pos, i) => (
        <Particle 
          key={i} 
          position={pos as [number, number, number]} 
          baseScale={1}
          speed={(i % 3 + 1) * 0.4} // Vary particle speeds
        />
      ))}
    </Instances>
  );
}

// Particle component with improved animation
function Particle({ position, baseScale, speed }: { 
  position: [number, number, number], 
  baseScale: number,
  speed: number
}) {
  const ref = useRef<THREE.Object3D>();
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      
      // Smooth sine wave animation
      const scale = baseScale * (0.8 + Math.sin(t * speed + offset) * 0.2);
      ref.current.scale.setScalar(scale);
      
      // Add subtle position animation
      ref.current.position.x = position[0] + Math.sin(t * speed * 0.5 + offset) * 0.03;
      ref.current.position.y = position[1] + Math.cos(t * speed * 0.5 + offset) * 0.03;
      ref.current.position.z = position[2] + Math.sin(t * speed * 0.3 + offset) * 0.03;
    }
  });

  return <Instance ref={ref} position={position} />;
}
