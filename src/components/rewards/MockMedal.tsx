import React from 'react';
import * as THREE from 'three';
import { MedalType } from '../../utils/modelLoader';

interface MockMedalOptions {
  type?: MedalType;
  detail?: 'low' | 'medium' | 'high';
}

const MEDAL_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF'
};

export default function MockMedal({ type = 'bronze', detail = 'medium' }: MockMedalOptions = {}) {
  const group = new THREE.Group();
  
  // Adjust geometry detail based on performance level
  const segments = {
    low: { circle: 32, details: 16 },
    medium: { circle: 64, details: 32 },
    high: { circle: 96, details: 48 }
  }[detail];

  // Create the main circular badge (Apple Watch style)
  const badgeRadius = 1;
  const badgeDepth = 0.08;
  const badgeGeometry = new THREE.CylinderGeometry(
    badgeRadius, 
    badgeRadius, 
    badgeDepth, 
    segments.circle
  );
  const badgeMesh = new THREE.Mesh(badgeGeometry);
  
  // Add subtle bevel to the edges
  const bevelSize = 0.03;
  const outerBevelGeometry = new THREE.TorusGeometry(
    badgeRadius, 
    bevelSize, 
    segments.details, 
    segments.circle
  );
  const outerBevel = new THREE.Mesh(outerBevelGeometry);
  outerBevel.position.y = badgeDepth / 2 - bevelSize / 2;
  
  const innerBevelGeometry = new THREE.TorusGeometry(
    badgeRadius, 
    bevelSize, 
    segments.details, 
    segments.circle
  );
  const innerBevel = new THREE.Mesh(innerBevelGeometry);
  innerBevel.position.y = -badgeDepth / 2 + bevelSize / 2;
  
  group.add(badgeMesh, outerBevel, innerBevel);

  // Add achievement-specific emblems based on type
  switch (type) {
    case 'diamond':
      // Diamond badge - Modern geometric shape with glow effect
      const diamondShape = new THREE.Group();
      
      // Create hexagonal shape
      const hexRadius = 0.65;
      const hexHeight = 0.12;
      const hexGeometry = new THREE.CylinderGeometry(
        hexRadius, hexRadius, hexHeight, 6, 1, false
      );
      const hexMesh = new THREE.Mesh(hexGeometry);
      hexMesh.position.y = 0.05;
      hexMesh.rotation.y = Math.PI / 6; // Rotate for better orientation
      diamondShape.add(hexMesh);
      
      // Add 3D star effect on top
      const starPoints = 6;
      const innerRadius = 0.2;
      const outerRadius = 0.5;
      
      const starShape = new THREE.Shape();
      for (let i = 0; i < starPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (starPoints * 2)) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();
      
      const starExtrudeSettings = {
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: segments.details,
      };
      
      const starGeometry = new THREE.ExtrudeGeometry(starShape, starExtrudeSettings);
      const starMesh = new THREE.Mesh(starGeometry);
      starMesh.position.set(0, 0.12, 0);
      starMesh.rotation.x = -Math.PI / 2;
      diamondShape.add(starMesh);
      
      group.add(diamondShape);
      break;

    case 'platinum':
      // Platinum badge - Clean circles with modern line accents
      const platinumEmblem = new THREE.Group();
      
      // Main circle
      const mainCircleGeometry = new THREE.TorusGeometry(0.6, 0.04, segments.details, segments.circle);
      const mainCircle = new THREE.Mesh(mainCircleGeometry);
      mainCircle.position.y = 0.05;
      platinumEmblem.add(mainCircle);
      
      // Inner circle
      const innerCircleGeometry = new THREE.TorusGeometry(0.4, 0.03, segments.details, segments.circle);
      const innerCircle = new THREE.Mesh(innerCircleGeometry);
      innerCircle.position.y = 0.06;
      platinumEmblem.add(innerCircle);
      
      // Crossing lines - Apple Watch style
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI;
        const lineGeometry = new THREE.BoxGeometry(1.2, 0.03, 0.03);
        const line = new THREE.Mesh(lineGeometry);
        line.position.y = 0.04;
        line.rotation.z = angle;
        platinumEmblem.add(line);
      }
      
      group.add(platinumEmblem);
      break;

    case 'gold':
      // Gold badge - Modern sun-like design
      const goldEmblem = new THREE.Group();
      
      // Center circle
      const centerCircleGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.03, segments.circle);
      const centerCircle = new THREE.Mesh(centerCircleGeometry);
      centerCircle.position.y = 0.05;
      goldEmblem.add(centerCircle);
      
      // Thin ring around center
      const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, segments.details, segments.circle);
      const ring = new THREE.Mesh(ringGeometry);
      ring.position.y = 0.06;
      goldEmblem.add(ring);
      
      // Radiating lines - Apple Watch Activity style
      const rayCount = 18;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const rayLength = 0.25;
        const rayGeometry = new THREE.BoxGeometry(rayLength, 0.02, 0.02);
        const ray = new THREE.Mesh(rayGeometry);
        
        // Position the ray outside the center circle
        ray.position.set(
          Math.cos(angle) * 0.65,
          0.05,
          Math.sin(angle) * 0.65
        );
        ray.rotation.y = angle + Math.PI / 2; // Rotate to point outward
        goldEmblem.add(ray);
      }
      
      group.add(goldEmblem);
      break;

    case 'silver':
      // Silver badge - Simple circles with dots pattern
      const silverEmblem = new THREE.Group();
      
      // Main circular plate
      const plateGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.04, segments.circle);
      const plate = new THREE.Mesh(plateGeometry);
      plate.position.y = 0.05;
      silverEmblem.add(plate);
      
      // Add circular pattern of dots
      const dotCount = 12;
      const dotRadius = 0.5;
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2;
        const dotGeometry = new THREE.SphereGeometry(0.04, segments.details, segments.details);
        const dot = new THREE.Mesh(dotGeometry);
        dot.position.set(
          Math.cos(angle) * dotRadius,
          0.08,
          Math.sin(angle) * dotRadius
        );
        silverEmblem.add(dot);
      }
      
      // Center dot
      const centerDotGeometry = new THREE.SphereGeometry(0.08, segments.details, segments.details);
      const centerDot = new THREE.Mesh(centerDotGeometry);
      centerDot.position.y = 0.08;
      silverEmblem.add(centerDot);
      
      group.add(silverEmblem);
      break;

    case 'bronze':
      // Bronze badge - Fitness badge inspired
      const bronzeEmblem = new THREE.Group();
      
      // Circular ring
      const bronzeRingGeometry = new THREE.TorusGeometry(0.55, 0.05, segments.details, segments.circle);
      const bronzeRing = new THREE.Mesh(bronzeRingGeometry);
      bronzeRing.position.y = 0.05;
      bronzeEmblem.add(bronzeRing);
      
      // Create upward arrow
      const arrowHeight = 0.5;
      const arrowWidth = 0.4;
      const arrowThickness = 0.05;
      
      // Arrow shaft
      const shaftGeometry = new THREE.BoxGeometry(arrowThickness, arrowHeight, arrowThickness);
      const shaft = new THREE.Mesh(shaftGeometry);
      shaft.position.y = 0.06;
      bronzeEmblem.add(shaft);
      
      // Arrow head
      const headGeometry = new THREE.ConeGeometry(arrowWidth / 2, arrowHeight / 3, 3);
      const head = new THREE.Mesh(headGeometry);
      head.position.y = 0.06 + arrowHeight / 2;
      head.rotation.z = Math.PI; // Point upwards
      bronzeEmblem.add(head);
      
      group.add(bronzeEmblem);
      break;
  }

  // Scale the entire group for better proportions
  group.scale.multiplyScalar(0.7);
  
  return group;
}
