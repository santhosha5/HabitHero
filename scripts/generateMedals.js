const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

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
function createMedalGeometry(type) {
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

  return group;
}

// Export medal to GLB
async function exportMedal(type) {
  const medal = createMedalGeometry(type);
  const config = MEDALS[type];

  // Apply materials
  medal.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: config.color,
        metalness: config.metalness,
        roughness: config.roughness,
      });
    }
  });

  // Export to GLTF (JSON format since we're in Node.js)
  const exporter = new GLTFExporter();
  const gltf = await new Promise((resolve) => {
    exporter.parse(medal, resolve, { 
      binary: false,
      onlyVisible: true,
      truncateDrawRange: true,
      maxTextureSize: 1024
    });
  });

  const outputPath = path.join(__dirname, '..', 'public', 'assets', 'models', 'medals', `${type}_medal.glb`);
  fs.writeFileSync(outputPath, JSON.stringify(gltf, null, 2));
  console.log(`Created ${type}_medal.glb`);
}

// Generate all medals
async function generateAllMedals() {
  for (const type of Object.keys(MEDALS)) {
    await exportMedal(type);
  }
}

// Run the generation
generateAllMedals().catch(console.error);
