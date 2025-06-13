import React, { useState } from 'react';
import { Medal3D } from '../../types/rewards';
import { TrophyIcon, SparklesIcon, FireIcon, StarIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

interface Medal3DViewerProps {
  medal: Medal3D;
}

export default function Medal3DViewer({ medal }: Medal3DViewerProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine glow intensity based on medal type
  const getGlowIntensity = () => {
    switch (medal.type) {
      case 'diamond': return '0 0 30px 8px';
      case 'platinum': return '0 0 25px 6px';
      case 'gold': return '0 0 20px 5px';
      case 'silver': return '0 0 15px 4px';
      default: return '0 0 10px 3px';
    }
  };

  // Medal animation effect based on type
  const getMedalAnimation = () => {
    const baseAnimation = "transform transition-all duration-700";
    
    if (isHovered) {
      switch (medal.type) {
        case 'diamond': return `${baseAnimation} scale-110 rotate-[360deg]`;
        case 'platinum': return `${baseAnimation} scale-110 rotate-[180deg]`;
        case 'gold': return `${baseAnimation} scale-110 rotate-[90deg]`;
        default: return `${baseAnimation} scale-110`;
      }
    }
    return `${baseAnimation} ${medal.animations.rotation ? 'animate-spin-slow' : ''} ${medal.type === 'diamond' || medal.type === 'platinum' ? 'animate-float' : ''}`;
  };
  
  // Get the appropriate icon based on medal type
  const getMedalIcon = () => {
    switch (medal.type) {
      case 'diamond': return <SparklesIcon className="h-10 w-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />;
      case 'platinum': return <StarIcon className="h-10 w-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />;
      case 'gold': return <TrophyIcon className="h-10 w-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />;
      case 'silver': return <BoltIcon className="h-10 w-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />;
      default: return <ShieldCheckIcon className="h-10 w-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" />;
    }
  };

  // Get medal gradient based on type
  const getMedalGradient = () => {
    switch (medal.type) {
      case 'diamond': 
        return 'linear-gradient(135deg, #B9F2FF 0%, #00FFFF 50%, #B9F2FF 100%)';
      case 'platinum': 
        return 'linear-gradient(135deg, #E5E4E2 0%, #A0A0A0 50%, #E5E4E2 100%)';
      case 'gold': 
        return 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)';
      case 'silver': 
        return 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 50%, #C0C0C0 100%)';
      default: 
        return 'linear-gradient(135deg, #CD7F32 0%, #A0522D 50%, #CD7F32 100%)';
    }
  };

  // Get medal texture pattern based on type
  const getMedalTexture = () => {
    switch (medal.type) {
      case 'diamond': 
        return "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 0L60 60H0V0zM30 0L60 30V0H30zM0 30L30 60H0V30z'/%3E%3C/g%3E%3C/svg%3E')";
      case 'platinum': 
        return "url('data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3C/g%3E%3C/svg%3E')";
      case 'gold': 
        return "url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E')";
      case 'silver': 
        return "url('data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H5z'/%3E%3C/g%3E%3C/svg%3E')";
      default: 
        return "url('data:image/svg+xml,%3Csvg width='48' height='32' viewBox='0 0 48 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 0h48v32H0V0zm24 16c-8.837 0-16-7.163-16-16h2c0 7.732 6.268 14 14 14s14-6.268 14-14h2c0 8.837-7.163 16-16 16z'/%3E%3C/g%3E%3C/svg%3E')";
    }
  };

  return (
    <div 
      className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 hover:shadow-xl medal-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-center p-5 relative">
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-30 transition-opacity duration-700"
          style={{ 
            backgroundColor: medal.materialProperties.color,
            opacity: isHovered ? 0.5 : 0.2,
            transform: `scale(${isHovered ? 1.5 : 1})`,
            transition: 'transform 0.7s ease-out, opacity 0.7s ease-out'
          }}
        />
        
        {/* Medal badge */}
        <div 
          className={`w-24 h-24 mx-auto rounded-full shadow-lg relative z-10 medal-badge ${getMedalAnimation()} ${medal.animations.glow ? 'animate-glow' : ''} flex items-center justify-center`}
          style={{ 
            background: getMedalGradient(),
            backgroundImage: getMedalTexture(),
            boxShadow: `${getGlowIntensity()} ${medal.materialProperties.color}${isHovered ? '70' : '40'}, inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.4)`
          }} 
        >
          {/* Medal icon */}
          <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
            <div className={`transform ${isHovered ? 'scale-125' : 'scale-100'} transition-transform duration-500`}>
              {getMedalIcon()}
            </div>
          </div>
          
          {/* Medal ring and embossed effect */}
          <div className="absolute inset-0 rounded-full border-4 border-white opacity-20"></div>
          <div className="absolute inset-0 rounded-full" style={{ 
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)',
            pointerEvents: 'none'
          }}></div>
          
          {/* Inner shine effect */}
          <div 
            className={`absolute w-full h-full rounded-full overflow-hidden ${medal.animations.particles ? 'animate-shimmer' : ''}`}
            style={{ 
              background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
              transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
              transition: 'transform 1s ease-in-out'
            }}
          />
        </div>
        
        <h3 className="mt-4 text-white text-lg font-bold capitalize relative z-10 transition-all duration-300"
        style={{ 
          textShadow: isHovered ? `0 0 10px ${medal.materialProperties.color}, 0 2px 4px rgba(0,0,0,0.5)` : '0 1px 3px rgba(0,0,0,0.5)',
          color: isHovered ? medal.materialProperties.color : 'white'
        }}
    >{medal.type} Medal</h3>
    <p className="text-gray-300 text-sm relative z-10 max-w-[200px] mx-auto transition-all duration-300"
       style={{
         opacity: isHovered ? 1 : 0.8,
         transform: isHovered ? 'translateY(0)' : 'translateY(2px)',
         textShadow: '0 1px 2px rgba(0,0,0,0.3)'
       }}
    >{medal.description}</p>
      </div>
    </div>
  );
}
