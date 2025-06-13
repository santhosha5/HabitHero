import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Medal3D } from '../../types/rewards';
import ThreeMedal from './ThreeMedal';
import { preloadMedalModels } from '../../utils/modelLoader';
import { TrophyIcon } from '@heroicons/react/24/solid';

const medalConfigs: Record<string, Medal3D> = {
  bronze: {
    id: 'bronze',
    type: 'bronze',
    materialProperties: {
      metalness: 0.8,
      roughness: 0.2,
      color: '#CD7F32',
    },
    animations: {
      rotation: true,
      glow: false,
      particles: false,
    },
    unlockPoints: 100,
    description: "First Steps",
    subtitle: "Complete your first 5 habits"
  },
  silver: {
    id: 'silver',
    type: 'silver',
    materialProperties: {
      metalness: 0.9,
      roughness: 0.1,
      color: '#C0C0C0',
    },
    animations: {
      rotation: true,
      glow: false,
      particles: false,
    },
    unlockPoints: 500,
    description: "Consistency Builder",
    subtitle: "Maintain a 7-day streak"
  },
  gold: {
    id: 'gold',
    type: 'gold',
    materialProperties: {
      metalness: 1,
      roughness: 0.1,
      color: '#FFD700',
    },
    animations: {
      rotation: true,
      glow: true,
      particles: false,
    },
    unlockPoints: 1000,
    description: "Habit Master",
    subtitle: "Complete 50 habits" 
  },
  platinum: {
    id: 'platinum',
    type: 'platinum',
    materialProperties: {
      metalness: 1,
      roughness: 0,
      color: '#E5E4E2',
      emissive: '#2C3E50',
    },
    animations: {
      rotation: true,
      glow: true,
      particles: true,
    },
    unlockPoints: 2500,
    description: "Discipline Champion",
    subtitle: "Maintain a 30-day streak"
  },
  diamond: {
    id: 'diamond',
    type: 'diamond',
    materialProperties: {
      metalness: 1,
      roughness: 0,
      color: '#B9F2FF',
      emissive: '#00FFFF',
    },
    animations: {
      rotation: true,
      glow: true,
      particles: true,
    },
    unlockPoints: 5000,
    description: "Lifestyle Transformer",
    subtitle: "Complete 100 habits with family"
  },
};

interface MedalTooltipProps {
  medal: Medal3D;
  isEarned: boolean;
  position: { x: number; y: number };
}

function MedalTooltip({ medal, isEarned, position }: MedalTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-50 p-4 bg-gray-900 text-white rounded-lg shadow-xl"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        maxWidth: '300px'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" 
              style={{ backgroundColor: medal.materialProperties.color }}>
          <TrophyIcon className="h-4 w-4 text-white" />
        </span>
        <h4 className="text-lg font-bold capitalize">{medal.type} Medal</h4>
      </div>
      <h5 className="text-md font-semibold text-gray-200">{medal.description}</h5>
      <p className="text-sm text-gray-300 mb-2">{medal.subtitle}</p>
      <p className="text-sm text-gray-400">
        {isEarned ? (
          'Congratulations! You\'ve earned this medal! 🎉'
        ) : (
          `Unlock at ${medal.unlockPoints.toLocaleString()} points`
        )}
      </p>
    </motion.div>
  );
}

interface MedalCollectionProps {
  earnedMedals: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const medalVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  hover: {
    scale: 1.05,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

// Medal spotlight effect
const spotlightVariants = {
  hidden: { opacity: 0, scale: 0 },
  show: { 
    opacity: [0, 0.7, 0],
    scale: [0.5, 1.5, 2],
    transition: { 
      duration: 2,
      repeat: Infinity,
      repeatDelay: 3
    }
  }
};

// Animation for unearned medals to subtly draw attention
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unearnedVariants = {
  initial: { filter: 'grayscale(1) opacity(0.5)' },
  hover: { 
    filter: 'grayscale(0) opacity(0.85)',
    transition: { duration: 0.5 } 
  }
};

export default function MedalCollection({ earnedMedals }: MedalCollectionProps) {
  const [selectedMedal, setSelectedMedal] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const collectionRef = useRef(null);
  const isInView = useInView(collectionRef, { once: false, amount: 0.2 });

  useEffect(() => {
    // Attempt to preload models
    preloadMedalModels()
      .catch(error => {
        console.warn('Some medal models failed to load:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleMedalHover = (type: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setSelectedMedal(type);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="bg-gray-800 rounded-lg p-4 animate-pulse"
          >
            <div className="w-full h-64 bg-gray-700 rounded-lg"></div>
            <div className="mt-4 flex flex-col items-center space-y-2">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Determine which medal should get the spotlight effect (highest earned medal)
  const highestEarnedMedal = [...earnedMedals].sort((a, b) => 
    medalConfigs[b].unlockPoints - medalConfigs[a].unlockPoints
  )[0];

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Achievement Collection</h2>
        <p className="text-gray-600">Earn medals by building consistent habits and reaching milestones</p>
      </div>
      
      <motion.div
        ref={collectionRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
      >
        {Object.entries(medalConfigs).map(([type, medal]) => {
          const isEarned = earnedMedals.includes(type);
          const isHighestEarned = type === highestEarnedMedal;
          
          return (
            <motion.div
              key={type}
              variants={medalVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              onMouseEnter={(e) => handleMedalHover(type, e)}
              onMouseLeave={() => setSelectedMedal(null)}
              className={`relative bg-gray-800 rounded-lg p-4 transition-all duration-500 ${
                !isEarned 
                  ? 'opacity-50 grayscale hover:opacity-85 hover:grayscale-0' 
                  : 'shadow-lg hover:shadow-xl'
              } cursor-pointer overflow-hidden group`}
              style={{
                boxShadow: isEarned ? `0 4px 20px -2px ${medal.materialProperties.color}${isHighestEarned ? '70' : '30'}` : ''
              }}
            >
              {/* Spotlight effect for highest earned medal */}
              {isHighestEarned && (
                <motion.div 
                  className="absolute inset-0 rounded-lg z-0"
                  style={{ 
                    background: `radial-gradient(circle, ${medal.materialProperties.color}40 0%, transparent 70%)`,
                    pointerEvents: 'none'
                  }}
                  variants={spotlightVariants}
                />
              )}
              
              {/* Hover effect */}
              <motion.div 
                className="absolute inset-0 rounded-lg z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ 
                  background: `radial-gradient(circle at center, ${medal.materialProperties.color}30 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1.2 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
              
              <div className="relative z-10">
                <ThreeMedal medal={medal} autoRotate={isEarned} />
                <motion.div
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-white capitalize group-hover:text-primary-400 transition-colors duration-300">
                    {medal.description}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1 group-hover:text-white transition-colors duration-300">
                    {medal.subtitle}
                  </p>
                  <div className="mt-2">
                    {isEarned ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center justify-center space-x-1 text-green-400 bg-green-900/30 px-2 py-1 rounded-full"
                      >
                        <TrophyIcon className="h-4 w-4" />
                        <span>Earned!</span>
                      </motion.div>
                    ) : (
                      <div className="text-gray-400 text-sm bg-gray-700/50 px-2 py-1 rounded-full group-hover:bg-primary-900/30 group-hover:text-primary-300 transition-all duration-300">
                        {medal.unlockPoints.toLocaleString()} points
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {selectedMedal && medalConfigs[selectedMedal] && (
          <MedalTooltip
            medal={medalConfigs[selectedMedal]}
            isEarned={earnedMedals.includes(selectedMedal)}
            position={tooltipPosition}
          />
        )}
      </AnimatePresence>
    </>
  );
}
