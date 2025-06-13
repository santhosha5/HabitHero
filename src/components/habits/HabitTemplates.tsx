import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { habitService } from '../../services/habitService';
import toast from 'react-hot-toast';
import { SparklesIcon, ArrowPathIcon, FireIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface HabitTemplate {
  title: string;
  description: string;
  twoMinuteVersion: string;
  suggestedStack: string;
  category: string;
  targetFrequency: number;
  atomicPrinciple?: 'cue' | 'craving' | 'response' | 'reward';
  locations?: string[];
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  // Health & Fitness
  {
    title: "Morning Glass of Water",
    description: "Start your day hydrated",
    twoMinuteVersion: "Fill and drink one glass of water",
    suggestedStack: "After I wake up",
    category: "Health",
    targetFrequency: 1,
    atomicPrinciple: 'cue',
    locations: ["Bedroom", "Kitchen"]
  },
  {
    title: "20-Minute Daily Walk",
    description: "Get fresh air and light exercise",
    twoMinuteVersion: "Walk to the end of your street and back",
    suggestedStack: "After I finish lunch",
    category: "Health",
    targetFrequency: 1,
    atomicPrinciple: 'response',
    locations: ["Outside Home", "Park", "Office"]
  },
  {
    title: "Screen Time Check",
    description: "Monitor and reduce excessive screen usage",
    twoMinuteVersion: "Check your daily screen time and note one insight",
    suggestedStack: "After I have dinner",
    category: "Digital Wellness",
    targetFrequency: 1,
    atomicPrinciple: 'craving',
    locations: ["Living Room", "Bedroom"]
  },
  {
    title: "Mindful Breathing",
    description: "Reduce stress with intentional breathing",
    twoMinuteVersion: "Take 5 deep breaths focusing on exhale",
    suggestedStack: "After I sit at my desk",
    category: "Mindfulness",
    targetFrequency: 1,
    atomicPrinciple: 'response',
    locations: ["Office", "Desk", "Anywhere quiet"]
  },
  {
    title: "Stretch Break",
    description: "Keep your body flexible and pain-free",
    twoMinuteVersion: "Do 3 shoulder rolls and neck stretches",
    suggestedStack: "After I've been sitting for 2 hours",
    category: "Health",
    targetFrequency: 1,
    atomicPrinciple: 'response',
    locations: ["Office", "Desk", "Couch"]
  },
  
  // Learning & Growth
  {
    title: "Evening Reading",
    description: "Read before bed for better sleep",
    twoMinuteVersion: "Read one page of any book",
    suggestedStack: "After I brush my teeth",
    category: "Learning",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Bedroom", "Living Room"]
  },
  {
    title: "Share Daily Insight",
    description: "Share one interesting idea you learned today",
    twoMinuteVersion: "Write one sentence about something interesting you discovered",
    suggestedStack: "After I have my evening tea",
    category: "Social Learning",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Living Room", "Kitchen"]
  },
  {
    title: "Listen to Educational Content",
    description: "Learn something new through audio",
    twoMinuteVersion: "Listen to 2 minutes of a podcast or audiobook",
    suggestedStack: "After I start my commute",
    category: "Learning",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Car", "Train", "Bus"]
  },
  
  // Digital Wellness
  {
    title: "Phone-Free Meals",
    description: "Eat mindfully without digital distraction",
    twoMinuteVersion: "Put phone in another room before sitting down to eat",
    suggestedStack: "After I prepare my meal",
    category: "Digital Wellness",
    targetFrequency: 1,
    atomicPrinciple: 'cue',
    locations: ["Kitchen", "Dining Room"]
  },
  {
    title: "Digital Sunset",
    description: "No screens 1 hour before bed",
    twoMinuteVersion: "Put all devices in charging station",
    suggestedStack: "After I set my clothes for tomorrow",
    category: "Digital Wellness",
    targetFrequency: 1,
    atomicPrinciple: 'cue',
    locations: ["Bedroom", "Living Room"]
  },
  
  // Social & Family
  {
    title: "Family Check-in",
    description: "Connect meaningfully with family members",
    twoMinuteVersion: "Send one thoughtful message to a family member",
    suggestedStack: "After I have my morning coffee",
    category: "Social",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Kitchen", "Living Room"]
  },
  {
    title: "Gratitude Practice",
    description: "Focus on positive aspects of your day",
    twoMinuteVersion: "Write down one thing you're grateful for",
    suggestedStack: "After I get into bed",
    category: "Mindfulness",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Bedroom"]
  },
  
  // Productivity & Organization
  {
    title: "Daily Priority Setting",
    description: "Start your day with clear intentions",
    twoMinuteVersion: "Write down your top 3 priorities for today",
    suggestedStack: "After I check my calendar",
    category: "Productivity",
    targetFrequency: 1,
    atomicPrinciple: 'cue',
    locations: ["Office", "Desk", "Home Office"]
  },
  {
    title: "5-Minute Tidy",
    description: "Keep your space organized and clear",
    twoMinuteVersion: "Put 5 items back in their proper place",
    suggestedStack: "After I finish working",
    category: "Organization",
    targetFrequency: 1,
    atomicPrinciple: 'response',
    locations: ["Office", "Living Room", "Kitchen"]
  },
  {
    title: "Evening Reflection",
    description: "Process your day and plan for tomorrow",
    twoMinuteVersion: "Write one sentence about today's highlight",
    suggestedStack: "After I turn off my work computer",
    category: "Productivity",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Office", "Home Office", "Living Room"]
  }
];

export default function HabitTemplates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddHabit = async (template: HabitTemplate) => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      const habitData = {
        user_id: user.id,
        title: template.title,
        description: template.description,
        two_minute_version: template.twoMinuteVersion,
        habit_stack: template.suggestedStack,
        category: template.category,
        target_frequency: template.targetFrequency,
        is_active: true
      };

      await habitService.createHabit(habitData);
      toast.success('Habit added successfully!');
      navigate('/habits');
    } catch (error: any) {
      console.error('Error adding habit:', error);
      toast.error(error.message || 'Failed to add habit');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(HABIT_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? HABIT_TEMPLATES
    : HABIT_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Habit Templates</h1>
        <button
          onClick={() => navigate('/habits/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Create Custom Habit
        </button>
      </div>

      {/* Category and Principles Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Category</h3>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Atomic Habits Principles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center p-2 bg-blue-50 rounded-md">
            <MapPinIcon className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm font-medium">Make it obvious</p>
              <p className="text-xs text-gray-500">Create clear cues</p>
            </div>
          </div>
          <div className="flex items-center p-2 bg-purple-50 rounded-md">
            <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
            <div>
              <p className="text-sm font-medium">Make it attractive</p>
              <p className="text-xs text-gray-500">Build anticipation</p>
            </div>
          </div>
          <div className="flex items-center p-2 bg-green-50 rounded-md">
            <ArrowPathIcon className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm font-medium">Make it easy</p>
              <p className="text-xs text-gray-500">Reduce friction</p>
            </div>
          </div>
          <div className="flex items-center p-2 bg-orange-50 rounded-md">
            <FireIcon className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm font-medium">Make it satisfying</p>
              <p className="text-xs text-gray-500">Feel rewarded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{template.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{template.description}</p>
              
              <div className="mt-4 space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">2-Minute Version</h4>
                    <p className="text-sm text-gray-500">{template.twoMinuteVersion}</p>
                  </div>
                
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Suggested Habit Stack</h4>
                    <p className="text-sm text-gray-500">{template.suggestedStack}</p>
                  </div>
                
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Category</h4>
                    <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                  </div>
                
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Target Frequency</h4>
                    <p className="text-sm text-gray-500">{template.targetFrequency} times per week</p>
                  </div>

                  {template.atomicPrinciple && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Atomic Habits Principle</h4>
                      <div className="flex items-center">
                        {template.atomicPrinciple === 'cue' && (
                          <><MapPinIcon className="h-4 w-4 text-blue-500 mr-1" />
                          <p className="text-sm text-gray-500">Make it obvious (Cue)</p></>
                        )}
                        {template.atomicPrinciple === 'craving' && (
                          <><SparklesIcon className="h-4 w-4 text-purple-500 mr-1" />
                          <p className="text-sm text-gray-500">Make it attractive (Craving)</p></>
                        )}
                        {template.atomicPrinciple === 'response' && (
                          <><ArrowPathIcon className="h-4 w-4 text-green-500 mr-1" />
                          <p className="text-sm text-gray-500">Make it easy (Response)</p></>
                        )}
                        {template.atomicPrinciple === 'reward' && (
                          <><FireIcon className="h-4 w-4 text-orange-500 mr-1" />
                          <p className="text-sm text-gray-500">Make it satisfying (Reward)</p></>
                        )}
                      </div>
                    </div>
                  )}

                  {template.locations && template.locations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Suggested Locations</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.locations.map((location, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              <div className="mt-6">
                <button
                  onClick={() => handleAddHabit(template)}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add to My Habits'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 