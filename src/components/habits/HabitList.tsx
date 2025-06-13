import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { habitService, Habit, HabitCompletion } from '../../services/habitService';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import HabitStreak from './HabitStreak';
import HabitProgressChart from './HabitProgressChart';

export default function HabitList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    if (!user) return;
    try {
      const userHabits = await habitService.getUserHabits(user.id);
      setHabits(userHabits);
      
      // Load habit completions
      const userCompletions = await habitService.getHabitCompletions(user.id);
      setCompletions(userCompletions);
    } catch (error) {
      toast.error('Failed to load habits');
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleCompleteHabit = async (habitId: string) => {
    if (!user) return;
    try {
      await habitService.completeHabit(habitId, user.id);
      toast.success('Habit completed! 🎉');
      loadHabits(); // Reload habits to update streaks
    } catch (error) {
      toast.error('Failed to complete habit');
      console.error('Error completing habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await habitService.deleteHabit(habitId);
      setHabits(habits.filter(h => h.id !== habitId));
      toast.success('Habit deleted');
    } catch (error) {
      toast.error('Failed to delete habit');
      console.error('Error deleting habit:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Habits</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/habits/templates')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Browse Templates
          </button>
          <button
            onClick={() => navigate('/habits/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Habit
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="bg-white shadow sm:rounded-lg overflow-hidden"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{habit.title}</h3>
                    {(habit.streak_count ?? 0) > 0 && (
                      <div className="ml-2">
                        <HabitStreak streak={habit.streak_count ?? 0} animate={(habit.streak_count ?? 0) >= 7} />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{habit.description}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {habit.category}
                    </span>
                    <span className="ml-2">
                      {habit.target_frequency}x per week
                    </span>
                    {habit.last_completed && (
                      <span className="ml-2 text-xs text-gray-400">
                        Last completed: {new Date(habit.last_completed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {habit.habit_stack && (
                    <p className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Habit Stack:</span> {habit.habit_stack}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="font-medium">2-Minute Version:</span> {habit.two_minute_version}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedHabit(selectedHabit === habit.id ? null : habit.id)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/habits/${habit.id}/edit`)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleCompleteHabit(habit.id)}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {selectedHabit === habit.id && (
                <div className="mt-6 border-t pt-4">
                  <HabitProgressChart 
                    habit={habit} 
                    completions={completions.filter(c => c.habit_id === habit.id)} 
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 