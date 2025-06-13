import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { habitService, Habit, HabitLocation } from '../../services/habitService';
import { useAuth } from '../../contexts/AuthContext';
import HabitStackSuggestions from './HabitStackSuggestions';
import LocationReminder from './LocationReminder';
import { LightBulbIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface HabitFormProps {
  habitId?: string;
  initialData?: {
    title: string;
    description: string;
    twoMinuteVersion: string;
    habitStack?: string;
    category: string;
    targetFrequency: number;
    locations?: HabitLocation[];
  };
}

export default function HabitForm({ habitId: propHabitId, initialData }: HabitFormProps) {
  const navigate = useNavigate();
  const { habitId: paramHabitId } = useParams();
  const effectiveHabitId = propHabitId || paramHabitId;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    twoMinuteVersion: initialData?.twoMinuteVersion || '',
    habitStack: initialData?.habitStack || '',
    category: initialData?.category || 'Health',
    targetFrequency: initialData?.targetFrequency || 1,
    locations: initialData?.locations || [],
  });
  const [userHabits, setUserHabits] = useState<Habit[]>([]);
  const [showTwoMinuteTip, setShowTwoMinuteTip] = useState(false);

  const categories = [
    'Health',
    'Learning',
    'Productivity',
    'Mindfulness',
    'Digital Wellness',
    'Social',
    'Organization',
  ];
  
  useEffect(() => {
    // Load user's existing habits for habit stacking suggestions
    // and load habit data if editing
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load user habits for suggestions
        const habits = await habitService.getUserHabits(user.id);
        setUserHabits(habits);
        
        // If editing an existing habit, load the data
        if (effectiveHabitId && !initialData) {
          setIsLoading(true);
          
          // Find the habit in the loaded habits
          const habit = habits.find(h => h.id === effectiveHabitId);
          
          if (habit) {
            // Load habit locations
            const locations = await habitService.getHabitLocations(effectiveHabitId);
            
            // Set form data
            setFormData({
              title: habit.title,
              description: habit.description || '',
              twoMinuteVersion: habit.two_minute_version,
              habitStack: habit.habit_stack || '',
              category: habit.category,
              targetFrequency: habit.target_frequency,
              locations: locations,
            });
          } else {
            toast.error("Habit not found");
            navigate('/habits');
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load habit data');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, effectiveHabitId, initialData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) throw new Error('User not authenticated');

      const habitData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        two_minute_version: formData.twoMinuteVersion,
        habit_stack: formData.habitStack,
        category: formData.category,
        target_frequency: formData.targetFrequency,
        is_active: true,
        locations: formData.locations
      };

      if (effectiveHabitId) {
        // Update existing habit
        await habitService.updateHabit(effectiveHabitId, habitData);
        toast.success('Habit updated successfully!');
      } else {
        // Create new habit
        await habitService.createHabit(habitData);
        toast.success('Habit created successfully!');
      }

      navigate('/habits');
    } catch (error: any) {
      console.error('Error saving habit:', error);
      toast.error(error.message || 'Failed to save habit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {effectiveHabitId ? 'Edit Habit' : 'Create New Habit'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Habit Title
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Morning Meditation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your habit..."
            rows={3}
          />
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              2-Minute Version (Required)
            </label>
            <button
              type="button"
              onClick={() => setShowTwoMinuteTip(!showTwoMinuteTip)}
              className="text-primary-500 hover:text-primary-700"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
          </div>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.twoMinuteVersion}
            onChange={(e) => setFormData({ ...formData, twoMinuteVersion: e.target.value })}
            placeholder="e.g., Take 5 deep breaths"
          />
          <p className="mt-1 text-sm text-gray-500">
            The smallest version of this habit that takes 2 minutes or less
          </p>
          
          {showTwoMinuteTip && (
            <div className="mt-2 bg-primary-50 p-3 rounded-md">
              <div className="flex items-start">
                <LightBulbIcon className="h-5 w-5 text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-primary-700">
                  <p className="font-medium mb-1">The 2-Minute Rule (Atomic Habits)</p>
                  <p>Start with a version of your habit that takes 2 minutes or less. This makes it so easy that you can't say no.</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>"Read one page" instead of "Read a book"</li>
                    <li>"Do one push-up" instead of "Work out"</li>
                    <li>"Write one sentence" instead of "Write a report"</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Habit Stack
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.habitStack}
            onChange={(e) => setFormData({ ...formData, habitStack: e.target.value })}
            placeholder="After I [existing habit], I will [new habit]"
          />
          <p className="mt-1 text-sm text-gray-500">
            Link this habit to an existing habit for better consistency
          </p>
          
          <HabitStackSuggestions 
            userHabits={userHabits}
            currentHabitId={effectiveHabitId}
            onSelectSuggestion={(suggestion) => 
              setFormData({ ...formData, habitStack: suggestion })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Frequency (times per week)
          </label>
          <input
            type="number"
            required
            min="1"
            max="7"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.targetFrequency}
            onChange={(e) => setFormData({ ...formData, targetFrequency: parseInt(e.target.value) })}
          />
        </div>

        <LocationReminder
          habitId={effectiveHabitId || ''}
          initialLocations={formData.locations}
          onSave={(locations) => {
            setFormData({ ...formData, locations });
            return Promise.resolve();
          }}
        />
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/habits')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : effectiveHabitId ? 'Update Habit' : 'Create Habit'}
          </button>
        </div>
      </form>
    </div>
  );
} 