import React from 'react';
import { FireIcon } from '@heroicons/react/24/solid';

interface HabitStreakProps {
  streak: number;
  maxStreak?: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export default function HabitStreak({ 
  streak, 
  maxStreak, 
  size = 'md', 
  animate = false 
}: HabitStreakProps) {
  // Determine the size classes
  const sizeClasses = {
    sm: 'text-xs h-5 w-5',
    md: 'text-sm h-6 w-6',
    lg: 'text-base h-8 w-8',
  };

  // Determine color based on streak length
  const getStreakColor = (count: number) => {
    if (count >= 30) return 'text-purple-500';
    if (count >= 21) return 'text-primary-500';
    if (count >= 14) return 'text-orange-500';
    if (count >= 7) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const streakColor = getStreakColor(streak);
  const iconClass = `${sizeClasses[size]} ${streakColor} ${animate ? 'animate-pulse' : ''}`;

  return (
    <div className="flex items-center">
      <div className="relative">
        <FireIcon className={iconClass} aria-hidden="true" />
        <span 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold ${
            size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-xs'
          }`}
        >
          {streak > 99 ? '99+' : streak}
        </span>
      </div>
      
      {maxStreak && maxStreak > streak && (
        <span className="ml-1 text-xs text-gray-500">
          (Best: {maxStreak})
        </span>
      )}
      
      {streak > 0 && (
        <span className="ml-1 text-xs font-medium">
          {streak === 1 ? 'day' : 'days'}
        </span>
      )}
    </div>
  );
}