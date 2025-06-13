import * as THREE from 'three';
import { Group, Mesh, MeshStandardMaterial } from 'three';

export type MedalType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Medal configurations
const MEDALS = {
  bronze: {
    color: 0xCD7F32,
    metalness: 0.8,
    roughness: 0.2,
  },
  silver: {
    color: 0xC0C0C0,
    metalness: 0.9,
    roughness: 0.1,
  },
  gold: {
    color: 0xFFD700,
    metalness: 1.0,
    roughness: 0.1,
  },
  platinum: {
    color: 0xE5E4E2,
    metalness: 1.0,
    roughness: 0.0,
  },
  diamond: {
    color: 0xB9F2FF,
    metalness: 1.0,
    roughness: 0.0,
  },
};

// Create medal geometry
function createMedalGeometry(type: MedalType): Group {
  const group = new THREE.Group();
  
  // Base medal disk
  const discGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 64);
  const discMesh = new THREE.Mesh(discGeometry);
  group.add(discMesh);

  // Outer ring
  const ringGeometry = new THREE.TorusGeometry(1.02, 0.04, 32, 64);
  const ringMesh = new THREE.Mesh(ringGeometry);
  group.add(ringMesh);

  // Add details based on medal type
  switch (type) {
    case 'diamond':
      const core = new THREE.OctahedronGeometry(0.6, 2);
      const coreMesh = new THREE.Mesh(core);
      coreMesh.position.y = 0.05;
      group.add(coreMesh);
      break;

    case 'platinum':
      for (let i = 0; i < 3; i++) {
        const radius = 0.4 + i * 0.2;
        const detailRing = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.02, 32, 64)
        );
        detailRing.position.y = 0.05;
        group.add(detailRing);
      }
      break;

    case 'gold':
      const centerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.03, 32, 64)
      );
      centerRing.position.y = 0.05;
      group.add(centerRing);

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const ray = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.02, 0.02)
        );
        ray.position.y = 0.05;
        ray.rotation.y = angle;
        group.add(ray);
      }
      break;

    case 'silver':
      [0.4, 0.6, 0.8].forEach(radius => {
        const circle = new THREE.Mesh(
          new THREE.RingGeometry(radius - 0.02, radius, 64)
        );
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 0.06;
        group.add(circle);
      });
      break;

    case 'bronze':
      const pattern = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.8, 64, 4)
      );
      pattern.rotation.x = -Math.PI / 2;
      pattern.position.y = 0.06;
      group.add(pattern);
      break;
  }

  // Apply materials
  const config = MEDALS[type];
  group.traverse(child => {
    if (child instanceof Mesh) {
      child.material = new MeshStandardMaterial({
        color: config.color,
        metalness: config.metalness,
        roughness: config.roughness,
      });
    }
  });

  return group;
}

// Cache for created models
const modelCache = new Map<string, Group>();

export const isModelAvailable = (type: MedalType): boolean => {
  return MEDALS.hasOwnProperty(type);
};

export const preloadMedalModels = async (): Promise<void> => {
  try {
    // Create all medal models
    for (const type of Object.keys(MEDALS) as MedalType[]) {
      if (!modelCache.has(type)) {
        const model = createMedalGeometry(type);
        modelCache.set(type, model);
      }
    }
  } catch (error) {
    console.error('Error during medal model creation:', error);
  }
};

export const clearMedalModels = () => {
  // Clear caches to free memory
  modelCache.forEach((model) => {
    model.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  });
  
  modelCache.clear();
};

export const getMedalModel = (type: MedalType): Group | null => {
  if (!modelCache.has(type)) {
    const model = createMedalGeometry(type);
    modelCache.set(type, model);
  }
  return modelCache.get(type) || null;
};

export const cloneMedalModel = (originalModel: Group): Group => {
  const clone = originalModel.clone(true);
  
  // Deep clone materials to allow individual customization
  clone.traverse((obj) => {
    if (obj instanceof Mesh) {
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map(m => 
          m instanceof MeshStandardMaterial ? m.clone() : m
        );
      } else if (obj.material instanceof MeshStandardMaterial) {
        obj.material = obj.material.clone();
      }
    }
  });
  
  return clone;
};
