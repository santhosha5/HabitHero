export interface HabitTemplate {
  title: string;
  description: string;
  twoMinuteVersion: string;
  suggestedStack: string;
  category: string;
  targetFrequency: number;
  atomicPrinciple?: 'cue' | 'craving' | 'response' | 'reward';
  locations?: string[];
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
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
    title: "Daily Journal",
    description: "Process thoughts and track progress",
    twoMinuteVersion: "Write one sentence about your day",
    suggestedStack: "After I finish dinner",
    category: "Mindfulness",
    targetFrequency: 1,
    atomicPrinciple: 'reward',
    locations: ["Desk", "Living Room", "Bedroom"]
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
];

export default HABIT_TEMPLATES;
