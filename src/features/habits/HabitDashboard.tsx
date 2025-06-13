import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { habitService, Habit, HabitCompletion } from '../../services/habitService';
import HabitStreak from '../../components/habits/HabitStreak';
import { PlusIcon, CheckCircleIcon, FireIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function HabitDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<string[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    longestStreak: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Load habits
        const userHabits = await habitService.getUserHabits(user.id);
        setHabits(userHabits);

        // Load completions
        const userCompletions = await habitService.getHabitCompletions(user.id);
        setCompletions(userCompletions);

        // Filter today's completions
        const today = new Date().toISOString().split('T')[0];
        const todayCompleted = userCompletions
          .filter(c => c.completed_at.startsWith(today))
          .map(c => c.habit_id);
        setTodayCompletions(todayCompleted);

        // Calculate stats
        const longestStreak = Math.max(...userHabits.map(h => h.streak_count || 0), 0);
        const completedToday = todayCompleted.length;
        const totalCompletions = userCompletions.length;
        const totalPossible = userHabits.length * 30; // Simplification: assume 30 days
        const completionRate = totalPossible > 0 
          ? Math.round((totalCompletions / totalPossible) * 100) 
          : 0;

        setStats({
          totalHabits: userHabits.length,
          completedToday,
          longestStreak,
          completionRate,
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load habit data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleCompleteHabit = async (habitId: string) => {
    if (!user) return;
    try {
      await habitService.completeHabit(habitId, user.id);
      
      // Update local state
      setTodayCompletions([...todayCompletions, habitId]);
      setStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1
      }));
      
      // Update the habit's streak
      const updatedHabits = habits.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            streak_count: (h.streak_count || 0) + 1,
            last_completed: new Date().toISOString()
          };
        }
        return h;
      });
      setHabits(updatedHabits);
      
      toast.success('Habit completed! 🎉');
    } catch (error) {
      console.error('Error completing habit:', error);
      toast.error('Failed to complete habit');
    }
  };

  // Group habits by category
  const habitsByCategory = habits.reduce((acc: Record<string, Habit[]>, habit) => {
    if (!acc[habit.category]) {
      acc[habit.category] = [];
    }
    acc[habit.category].push(habit);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {greeting()}, {user?.email}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your habits and progress today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Habits</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalHabits}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500">Completed Today</h3>
            <p className="mt-1 text-3xl font-semibold text-primary-600">
              {stats.completedToday} / {stats.totalHabits}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500">Longest Streak</h3>
            <div className="mt-1 flex items-center">
              <p className="text-3xl font-semibold text-primary-600">{stats.longestStreak}</p>
              <FireIcon className="ml-2 h-6 w-6 text-orange-500" />
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
            <p className="mt-1 text-3xl font-semibold text-primary-600">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Today's Habits */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Today's Habits</h3>
              <button
                onClick={() => navigate('/habits/new')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                New Habit
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="mt-5">
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <PlusIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        No habits set up yet
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Get started by creating your first habit. Remember to follow the 2-minute rule!
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="-mx-2 -my-1.5 flex">
                          <button
                            onClick={() => navigate('/habits/templates')}
                            className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                          >
                            Browse habit templates
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {Object.entries(habitsByCategory).map(([category, categoryHabits]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryHabits.map((habit) => {
                        const isCompleted = todayCompletions.includes(habit.id);
                        return (
                          <div 
                            key={habit.id} 
                            className={`rounded-lg border p-4 transition-colors ${
                              isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-primary-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-md font-medium text-gray-900">{habit.title}</h3>
                                  {(habit.streak_count ?? 0) > 0 && (
                                    <div className="ml-2">
                                      <HabitStreak 
                                        streak={habit.streak_count ?? 0} 
                                        size="sm" 
                                        animate={(habit.streak_count ?? 0) >= 7} 
                                      />
                                    </div>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{habit.two_minute_version}</p>
                              </div>
                              <button
                                onClick={() => !isCompleted && handleCompleteHabit(habit.id)}
                                disabled={isCompleted}
                                className={`rounded-full p-1 ${
                                  isCompleted 
                                    ? 'text-green-500 bg-green-100' 
                                    : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircleIconSolid className="h-6 w-6" />
                                ) : (
                                  <CheckCircleIcon className="h-6 w-6" />
                                )}
                              </button>
                            </div>
                            
                            {habit.habit_stack && (
                              <div className="mt-2 text-xs text-gray-500 italic">
                                "{habit.habit_stack}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Family Activity Placeholder */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Family Activity</h3>
            <div className="mt-5">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Join a family to see activity
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Connect with your family members to see their progress and cheer them on!
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <a
                          href="/family"
                          className="rounded-md bg-blue-50 px-2 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                        >
                          Join or create a family
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper function to get appropriate greeting based on time of day
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}