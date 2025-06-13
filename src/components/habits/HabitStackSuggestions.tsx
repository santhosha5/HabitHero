import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Habit } from '../../services/habitService';

interface HabitStackSuggestionsProps {
  userHabits: Habit[];
  currentHabitId?: string;
  onSelectSuggestion: (suggestion: string) => void;
}

export default function HabitStackSuggestions({
  userHabits,
  currentHabitId,
  onSelectSuggestion,
}: HabitStackSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Common daily activities that can be used as habit stacks
  const commonActivities = [
    'After I wake up',
    'After I brush my teeth',
    'After I shower',
    'After I have breakfast',
    'After I arrive at work',
    'After I have lunch',
    'After I get home from work',
    'After I have dinner',
    'Before I go to bed',
  ];

  useEffect(() => {
    // Generate suggestions based on existing habits and common activities
    const generateSuggestions = () => {
      setIsLoading(true);
      
      const habitSuggestions = userHabits
        .filter(habit => !currentHabitId || habit.id !== currentHabitId)
        .map(habit => `After I ${habit.title.toLowerCase()}`);
      
      // Combine user habits and common activities, removing duplicates
      const allSuggestions = Array.from(new Set([...habitSuggestions, ...commonActivities]));
      
      // Shuffle array to provide varied suggestions
      const shuffledSuggestions = allSuggestions
        .sort(() => 0.5 - Math.random())
        .slice(0, 5); // Only show top 5 suggestions
      
      setSuggestions(shuffledSuggestions);
      setIsLoading(false);
    };

    generateSuggestions();
  }, [userHabits, currentHabitId]);

  if (isLoading) {
    return (
      <div className="mt-2 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center text-xs text-gray-500 mb-2">
        <SparklesIcon className="h-4 w-4 mr-1 text-primary-500" />
        <span>Suggested habit stacks:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectSuggestion(suggestion)}
            className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}