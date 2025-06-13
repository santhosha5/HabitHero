import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Medal3D } from '../../types/rewards';

interface ThreeMedalProps {
  medal: Medal3D;
  autoRotate?: boolean;
  onClick?: () => void;
  scale?: number;
}

// Custom hook for creating procedural textures
function useProceduralTextures() {
  const textures = useMemo(() => {
    // Create a more detailed normal map texture (4x4 pixels)
    const normalMap = new THREE.DataTexture(
      new Uint8Array([
        // Top row
        128, 128, 255, 255, 140, 140, 255, 255, 128, 128, 255, 255, 140, 140, 255, 255,
        // Second row
        140, 140, 255, 255, 128, 128, 255, 255, 140, 140, 255, 255, 128, 128, 255, 255,
        // Third row
        128, 128, 255, 255, 140, 140, 255, 255, 128, 128, 255, 255, 140, 140, 255, 255,
        // Bottom row
        140, 140, 255, 255, 128, 128, 255, 255, 140, 140, 255, 255, 128, 128, 255, 255
      ]),
      4, 4,
      THREE.RGBAFormat
    );
    normalMap.needsUpdate = true;

    // Create a more detailed roughness map texture (4x4 pixels)
    const roughnessMap = new THREE.DataTexture(
      new Uint8Array([
        // Top row
        128, 128, 128, 255, 140, 140, 140, 255, 128, 128, 128, 255, 140, 140, 140, 255,
        // Second row
        140, 140, 140, 255, 128, 128, 128, 255, 140, 140, 140, 255, 128, 128, 128, 255,
        // Third row
        128, 128, 128, 255, 140, 140, 140, 255, 128, 128, 128, 255, 140, 140, 140, 255,
        // Bottom row
        140, 140, 140, 255, 128, 128, 128, 255, 140, 140, 140, 255, 128, 128, 128, 255
      ]),
      4, 4,
      THREE.RGBAFormat
    );
    roughnessMap.needsUpdate = true;

    // Create a more detailed ambient occlusion map texture (4x4 pixels)
    const aoMap = new THREE.DataTexture(
      new Uint8Array([
        // Top row
        255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255,
        // Second row
        240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255,
        // Third row
        255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255,
        // Bottom row
        240, 240, 240, 255, 255, 255, 255, 255, 240, 240, 240, 255, 255, 255, 255, 255
      ]),
      4, 4,
      THREE.RGBAFormat
    );
    aoMap.needsUpdate = true;

    return { normalMap, roughnessMap, aoMap };
  }, []);

  return textures;
}

// MedalModel component handles the actual 3D model rendering
function MedalModel({ medal, onClick, scale = 1 }: ThreeMedalProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  // Use procedural textures
  const { normalMap, roughnessMap, aoMap } = useProceduralTextures();
  
  // Get color based on medal type with enhanced colors
  const getMedalColor = () => {
    switch (medal.type) {
      case 'diamond': return new THREE.Color('#B9F2FF').multiplyScalar(1.2); // Brighter diamond
      case 'platinum': return new THREE.Color('#E5E4E2').multiplyScalar(1.1); // Brighter platinum
      case 'gold': return new THREE.Color('#FFD700').multiplyScalar(1.1); // Brighter gold
      case 'silver': return new THREE.Color('#C0C0C0').multiplyScalar(1.1); // Brighter silver
      default: return new THREE.Color('#CD7F32').multiplyScalar(1.1); // Brighter bronze
    }
  };
  
  // Get metalness and roughness properties with enhanced values
  const getMaterialProps = () => {
    switch (medal.type) {
      case 'diamond': return { metalness: 0.95, roughness: 0.05 };
      case 'platinum': return { metalness: 0.9, roughness: 0.15 };
      case 'gold': return { metalness: 0.85, roughness: 0.2 };
      case 'silver': return { metalness: 0.8, roughness: 0.25 };
      default: return { metalness: 0.75, roughness: 0.3 }; // bronze
    }
  };
  
  // Enhanced animation
  useFrame((state, delta) => {
    if (group.current) {
      // Base rotation with smooth easing
      group.current.rotation.y += delta * 0.2;
      
      // Enhanced hover effect
      if (hovered) {
        group.current.rotation.y += delta * 0.5;
        group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        group.current.scale.setScalar(1.05); // Slight scale up on hover
      } else {
        group.current.scale.setScalar(1);
      }
      
      // Enhanced click effect
      if (clicked) {
        group.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.1;
        group.current.scale.setScalar(1.1); // Scale up on click
        setTimeout(() => {
          setClicked(false);
          group.current?.scale.setScalar(1);
        }, 500);
      }
    }
  });
  
  // Handle pointer events
  const handlePointerOver = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setClicked(true);
    if (onClick) onClick();
  };
  
  return (
    <group 
      ref={group}
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Medal base with enhanced geometry */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.15, 64, 4, true]} />
        <meshStandardMaterial
          color={getMedalColor()}
          {...getMaterialProps()}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          aoMap={aoMap}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Enhanced medal rim */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.12, 64, 1, true]} />
        <meshStandardMaterial
          color={new THREE.Color('#FFFFFF')}
          metalness={0.95}
          roughness={0.05}
          normalMap={normalMap}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Enhanced medal front emblem */}
      <mesh castShadow position={[0, 0, 0.1]}>
        <circleGeometry args={[0.7, 64]} />
        <meshStandardMaterial
          color={getMedalColor()}
          {...getMaterialProps()}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Enhanced medal back side */}
      <mesh castShadow position={[0, 0, -0.1]}>
        <circleGeometry args={[0.7, 64]} />
        <meshStandardMaterial
          color={getMedalColor()}
          {...getMaterialProps()}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Enhanced lighting effects */}
      {(medal.type === 'diamond' || medal.type === 'platinum') && (
        <>
          <pointLight 
            position={[0, 0, 1]} 
            intensity={2} 
            distance={3}
            color={medal.type === 'diamond' ? '#B9F2FF' : '#FFFFFF'}
          />
          <pointLight 
            position={[0, 0, -1]} 
            intensity={1} 
            distance={3}
            color={medal.type === 'diamond' ? '#B9F2FF' : '#FFFFFF'}
          />
        </>
      )}
      
      {/* Enhanced particle effects for diamond medals */}
      {medal.type === 'diamond' && medal.animations.particles && (
        <DiamondParticles />
      )}
    </group>
  );
}

// Diamond particle effect
function DiamondParticles() {
  const particles = useRef<THREE.Points>(null);
  const particleCount = 50;
  
  // Create particles
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    // Random position in a sphere
    const radius = 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Random speed
    speeds[i] = 0.1 + Math.random() * 0.3;
  }
  
  useFrame((state) => {
    if (particles.current) {
      const positions = (particles.current.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        // Move particles toward center
        const idx = i * 3;
        const dx = positions[idx] * 0.98;
        const dy = positions[idx + 1] * 0.98;
        const dz = positions[idx + 2] * 0.98;
        
        positions[idx] = dx;
        positions[idx + 1] = dy;
        positions[idx + 2] = dz;
        
        // Reset particles that get too close to center
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.1) {
          const radius = 1.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          
          positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
          positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[idx + 2] = radius * Math.cos(phi);
        }
      }
      
      (particles.current.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#FFFFFF"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}

// Main ThreeMedal component
export default function ThreeMedal({ medal, autoRotate = true, onClick, scale = 1 }: ThreeMedalProps) {
  return (
    <div className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} />
        
        <MedalModel medal={medal} onClick={onClick} scale={scale} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute bottom-0 left-0 w-full p-4 text-center bg-gradient-to-t from-gray-900 to-transparent">
        <h3 className="text-lg font-bold text-white capitalize">
          {medal.type} Medal
        </h3>
        <p className="text-sm text-gray-300">
          {medal.description}
        </p>
      </div>
    </div>
  );
}