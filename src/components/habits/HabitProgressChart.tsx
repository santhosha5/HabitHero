import React, { useState, useEffect } from 'react';
import { CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Habit, HabitCompletion } from '../../services/habitService';

interface HabitProgressChartProps {
  habit: Habit;
  completions: HabitCompletion[];
  timeframe?: 'week' | 'month' | 'year';
}

export default function HabitProgressChart({
  habit,
  completions,
  timeframe = 'week'
}: HabitProgressChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>(timeframe);
  const [chartData, setChartData] = useState<Array<{ date: string; completed: boolean }>>([]);
  const [stats, setStats] = useState({
    completionRate: 0,
    totalCompletions: 0,
    currentStreak: habit.streak_count || 0,
    targetFrequency: habit.target_frequency
  });

  useEffect(() => {
    const now = new Date();
    const dates: Array<{ date: string; completed: boolean }> = [];
    
    // Generate dates based on selected timeframe
    if (selectedTimeframe === 'week') {
      // Get dates for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push({
          date: date.toISOString().split('T')[0],
          completed: false
        });
      }
    } else if (selectedTimeframe === 'month') {
      // Get dates for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push({
          date: date.toISOString().split('T')[0],
          completed: false
        });
      }
    } else {
      // Get dates for the last 12 months (simplified - first day of each month)
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i, 1);
        dates.push({
          date: date.toISOString().split('T')[0],
          completed: false
        });
      }
    }

    // Mark dates with completions
    const completionDates = completions.map(c => c.completed_at.split('T')[0]);
    
    const updatedDates = dates.map(d => ({
      ...d,
      completed: completionDates.includes(d.date)
    }));

    setChartData(updatedDates);

    // Calculate stats
    const totalDays = dates.length;
    const completedDays = updatedDates.filter(d => d.completed).length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    setStats({
      completionRate,
      totalCompletions: completedDays,
      currentStreak: habit.streak_count || 0,
      targetFrequency: habit.target_frequency
    });
  }, [habit, completions, selectedTimeframe]);

  const getFormattedDate = (dateString: string): string => {
    if (selectedTimeframe === 'year') {
      // For year view, just show month name
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    } else if (selectedTimeframe === 'month') {
      // For month view, show day and month
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(date);
    } else {
      // For week view, show day of week
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Habit Progress</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTimeframe('week')}
            className={`px-2 py-1 text-xs rounded-md ${
              selectedTimeframe === 'week'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedTimeframe('month')}
            className={`px-2 py-1 text-xs rounded-md ${
              selectedTimeframe === 'month'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedTimeframe('year')}
            className={`px-2 py-1 text-xs rounded-md ${
              selectedTimeframe === 'year'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Completion Rate</p>
          <p className="text-lg font-semibold text-primary-600">{stats.completionRate}%</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Current Streak</p>
          <p className="text-lg font-semibold text-primary-600">{stats.currentStreak}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Total Completions</p>
          <p className="text-lg font-semibold text-primary-600">{stats.totalCompletions}</p>
        </div>
      </div>

      {/* Visual representation */}
      {selectedTimeframe === 'week' || selectedTimeframe === 'month' ? (
        <div className="flex justify-between items-end h-40 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 ${
                  item.completed ? 'bg-primary-500' : 'bg-gray-200'
                } rounded-t`}
                style={{ height: item.completed ? '100%' : '20%' }}
              ></div>
              <p className="text-xs text-gray-500 mt-1">{getFormattedDate(item.date)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-1 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-full aspect-square rounded-sm ${
                  item.completed ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              ></div>
              <p className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                {getFormattedDate(item.date)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center mt-6 text-xs text-gray-500">
        <CalendarIcon className="h-4 w-4 mr-1" />
        <p>
          Target: {stats.targetFrequency} time{stats.targetFrequency !== 1 && 's'} per week
        </p>
      </div>
    </div>
  );
}