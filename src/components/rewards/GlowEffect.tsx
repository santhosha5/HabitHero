import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

const GlowMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(),
    uIntensity: 1,
    uPulseSpeed: 1,
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uPulseSpeed;
    
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
      float pulse = (sin(uTime * uPulseSpeed) + 1.0) * 0.5;
      vec3 glowColor = uColor * fresnel * uIntensity * (0.8 + pulse * 0.4);
      gl_FragColor = vec4(glowColor, fresnel);
    }
  `
);

extend({ GlowMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    glowMaterial: any
  }
}

interface GlowEffectProps {
  intensity?: number;
  pulseSpeed?: number;
  color?: string;
}

export default function GlowEffect({ 
  intensity = 1, 
  pulseSpeed = 1,
  color = '#ffffff'
}: GlowEffectProps) {
  const materialRef = useRef<any>();
  // Higher segment count for smoother appearance
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1.15, 48, 48), []);
  const colorVector = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh geometry={sphereGeometry}>
      <glowMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        uColor={colorVector}
        uIntensity={intensity}
        uPulseSpeed={pulseSpeed}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
