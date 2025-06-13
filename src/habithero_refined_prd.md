# HabitHero Refined Product Requirements Document (PRD)

## 1. Introduction

### Purpose
Develop a family-focused habit-tracking web application to help 30+ year old family members build consistent, sustainable habits through gamified challenges and social accountability, starting with a focused trial within your immediate family circle.

### Problem Statement
Adults in their 30s struggle to maintain consistent habits due to:
- Busy work and family schedules
- Lack of accountability partners
- Overwhelming habit-tracking apps that focus on perfection over progress
- Isolation in personal development efforts

### Core Principles (Based on Atomic Habits)
- **Make it Obvious**: Clear visual cues and habit stacking suggestions
- **Make it Attractive**: Social rewards and family recognition
- **Make it Easy**: 2-minute rule implementation and habit simplification  
- **Make it Satisfying**: Immediate rewards and progress visualization

### Success Metrics
- Family participation rate >80% after 30 days
- Average habit completion rate >60% per user
- Weekly active engagement >5 days per user
- User retention >70% after 8 weeks

## 2. Target Audience

### Primary Users
- **Family Members (Ages 28-40)**: Your immediate family circle (~8-12 people)
- **Characteristics**: Tech-comfortable, time-constrained, motivated by family connection
- **Current Pain Points**: 
  - Start habits but don't stick
  - Want family support but lack structured way to engage
  - Overwhelmed by complex tracking systems

### User Personas

**Primary Persona: "Busy Parent Sam" (32)**
- Works full-time, has young kids
- Wants to exercise and read more
- Struggles with consistency due to unpredictable schedule
- Motivated by family approval and gentle competition
- Prefers simple, quick interactions (2-3 minutes max per day)

**Secondary Persona: "Career-Focused Alex" (29)**
- Single professional, ambitious
- Interested in productivity and wellness habits
- Has time but lacks accountability
- Enjoys competition and measurable progress

## 3. Core Features (MVP 1)

### 3.1 Habit Creation & Management
**Atomic Habits Integration:**
- **Habit Stacking**: "After I [existing habit], I will [new habit]"
- **2-Minute Rule**: Every habit must have a 2-minute version
- **Environment Design**: Location-based habit reminders

**Features:**
- Pre-defined habit templates with 2-minute versions:
  - "Drink one glass of water" (after morning coffee)
  - "Do 5 push-ups" (after brushing teeth)
  - "Read one page" (after dinner)
  - "Meditate for 2 minutes" (after waking up)
  - "Write one sentence in journal" (before bed)
- Custom habit creation with mandatory 2-minute version
- Habit stacking suggestions based on existing routines
- Visual habit chain/streak counter

### 3.2 Family Circle System
- Private family group (invite-only via email/link)
- Family member profiles with preferred habits
- Shared family calendar showing everyone's habit goals
- Family habit suggestions ("3 family members are doing morning walks")

### 3.3 Reward & Recognition System
**Immediate Satisfaction (Atomic Habits Principle):**
- **Instant Visual Feedback**: Animated checkmarks, streak flames
- **3D Medal Collection**: Interactive 3D medals for achievements
- **Social Recognition**: Family notifications for milestones
- **Tangible Rewards**: Point system + real money pool for winners

**Reward Structure:**
- **Daily Points**: 10 points per completed habit
- **Streak Bonuses**: 2x points after 7 days, 3x after 21 days
- **Family Challenges**: Bonus points for group achievements

**3D Medal System:**
- **Bronze Medal** (100 points): 3D bronze medal with engraved habit category
- **Silver Medal** (500 points): 3D silver medal with streak flame animation
- **Gold Medal** (1000 points): 3D gold medal with spinning trophy effect
- **Platinum Medal** (2500 points): 3D platinum medal with particle effects
- **Diamond Medal** (5000 points): 3D diamond medal with rainbow sparkles

**Weekly Money Pool System:**
- Each family member contributes $2/week to shared pool
- Weekly winner (highest habit completion %) wins 60% of pool
- Second place gets 25%, third gets 15%
- Pool resets every Sunday at midnight
- Minimum 5 family members required to activate money pool
- Payment handled through Venmo/PayPal integration

### 3.4 Social Accountability Features
- Daily family activity feed
- Gentle encouragement system (not shame-based)
- Weekly family check-ins with progress celebration
- Private family challenges (e.g., "Family Fitness Week")

### 3.5 Progress Visualization
- Individual habit chains/streaks
- Family progress dashboard
- Weekly/monthly summary reports
- Habit difficulty adjustment suggestions

## 4. Technical Architecture (Simplified)

### Technology Stack
- **Frontend**: React (TypeScript) with Tailwind CSS + Three.js for 3D medals
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **3D Graphics**: Three.js for medal rendering and animations
- **Hosting**: Vercel (seamless with React)
- **Notifications**: Web Push API + Email (Resend.com)
- **Payments**: Stripe Connect (for weekly money pool distribution)
- **External Integrations**: Venmo/PayPal API for pool payouts

### Why This Stack:
- **Supabase**: Better free tier than Firebase (2 free projects, 500MB DB)
- **Vercel**: Free hosting with excellent React integration
- **Single Platform**: Web-first approach reduces complexity
- **Type Safety**: TypeScript prevents runtime errors
- **Cost Effective**: Free tier supports 50+ family members

### Database Schema (Supabase PostgreSQL)

```sql
-- Users table
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  full_name: text,
  avatar_url: text,
  family_id: uuid REFERENCES families(id),
  created_at: timestamp,
  total_points: integer DEFAULT 0
)

-- Families table
families (
  id: uuid PRIMARY KEY,
  name: text,
  invite_code: text UNIQUE,
  created_by: uuid REFERENCES users(id),
  created_at: timestamp
)

-- Habits table
habits (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  title: text,
  description: text,
  two_minute_version: text,
  habit_stack: text, -- "After I [trigger], I will [habit]"
  category: text,
  target_frequency: integer, -- times per week
  created_at: timestamp,
  is_active: boolean DEFAULT true
)

-- Habit Completions table
habit_completions (
  id: uuid PRIMARY KEY,
  habit_id: uuid REFERENCES habits(id),
  user_id: uuid REFERENCES users(id),
  completed_at: timestamp,
  points_earned: integer,
  streak_day: integer
)

-- Family Challenges table
family_challenges (
  id: uuid PRIMARY KEY,
  family_id: uuid REFERENCES families(id),
  title: text,
  description: text,
  start_date: date,
  end_date: date,
  target_metric: integer,
  bonus_points: integer,
  created_by: uuid REFERENCES users(id)
)

-- Weekly Money Pool table
weekly_pools (
  id: uuid PRIMARY KEY,
  family_id: uuid REFERENCES families(id),
  week_start: date,
  week_end: date,
  total_amount: decimal(10,2),
  participants: json, -- array of user_ids who contributed
  winners: json, -- array of {user_id, rank, payout_amount}
  status: text DEFAULT 'active', -- 'active', 'completed', 'paid_out'
  created_at: timestamp
)

-- 3D Medals table
medals (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  medal_type: text, -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  medal_category: text, -- habit category that earned the medal
  points_required: integer,
  earned_at: timestamp,
  three_d_model_url: text, -- URL to 3D model file
  animation_type: text -- 'spin', 'glow', 'particle_effect'
)
```

## 5. MVP 1 Development Specification

### 5.1 Core User Flows

**Flow 1: Family Onboarding**
1. User signs up with email (Supabase Auth)
2. Creates or joins family using invite code
3. Completes profile (name, preferred habits from templates)
4. Views family dashboard with all members

**Flow 2: Daily Habit Management**
1. User sees today's habits with visual streak indicators
2. Clicks to mark habit complete (animated feedback)
3. Sees points earned and updated streak
4. Views family activity feed with recent completions

**Flow 3: Habit Creation (Atomic Habits)**
1. User selects habit template or creates custom
2. System prompts for 2-minute version
3. User sets habit stack trigger ("After I...")
4. Habit added to daily checklist

### 5.2 UI/UX Requirements

**Design Principles:**
- **Mobile-first responsive design**
- **Maximum 3-click navigation** to any feature
- **High contrast, accessibility-compliant**
- **Celebration animations** for completions
- **Calm, encouraging tone** (no guilt/shame)

**Key Screens:**
1. **Dashboard**: Today's habits, family activity, points total
2. **Habits**: Manage personal habits, view streaks
3. **Family**: Family members, shared challenges, leaderboard
4. **Profile**: Personal stats, rewards, settings

### 5.3 Detailed Technical Implementation Prompt

---

## COMPLETE DEVELOPMENT PROMPT FOR AI AGENT

Build HabitHero MVP 1 - A family-focused habit tracker implementing Atomic Habits principles.

### PROJECT SETUP
```bash
# Initialize React TypeScript project
npx create-react-app habithero --template typescript
cd habithero
npm install @supabase/supabase-js react-router-dom @headlessui/react @heroicons/react tailwindcss three @types/three @react-three/fiber @react-three/drei
```

### SUPABASE CONFIGURATION
1. Create Supabase project at supabase.com
2. Run SQL schema (provided above) in Supabase SQL Editor
3. Enable Row Level Security (RLS) on all tables
4. Set up authentication policies for family-based access

### REQUIRED COMPONENTS & FEATURES

#### 1. Authentication System
**Files**: `src/auth/`
- `AuthProvider.tsx`: Supabase auth context
- `LoginForm.tsx`: Email/password login
- `SignupForm.tsx`: Account creation with family join option
- `ProtectedRoute.tsx`: Route protection wrapper

**Requirements**:
- Email signup/login with Supabase Auth
- Automatic family assignment via invite code
- Persistent login state management
- Password reset functionality

#### 2. Family Management
**Files**: `src/family/`
- `FamilyDashboard.tsx`: Overview of all family members
- `FamilyInvite.tsx`: Generate and share invite codes
- `FamilyActivity.tsx`: Real-time activity feed
- `FamilyChallenge.tsx`: Create and join family challenges

**Requirements**:
- Generate unique 6-character invite codes
- Real-time updates using Supabase subscriptions
- Family member avatar display
- Activity feed with timestamps and celebrations

#### 3. Habit Management (Core Feature)
**Files**: `src/habits/`
- `HabitDashboard.tsx`: Today's habits with completion status
- `HabitForm.tsx`: Create/edit habits with Atomic Habits fields
- `HabitCard.tsx`: Individual habit display with streak
- `HabitTemplates.tsx`: Pre-defined habit suggestions
- `HabitStack.tsx`: Habit stacking interface

**Requirements**:
- **Habit Templates**: Pre-populate 20+ habits with 2-minute versions
- **Habit Stacking**: "After I [trigger], I will [habit]" interface
- **Streak Calculation**: Auto-calculate from completion history
- **Visual Feedback**: Animated checkmarks, flame icons for streaks
- **2-Minute Rule**: Mandatory simplified version for each habit

**Habit Templates to Include**:
```typescript
const HABIT_TEMPLATES = [
  // Health & Fitness
  {
    title: "Morning Glass of Water",
    description: "Start your day hydrated",
    twoMinuteVersion: "Fill and drink one glass of water",
    suggestedStack: "After I wake up",
    category: "Health"
  },
  {
    title: "20-Minute Daily Walk",
    description: "Get fresh air and light exercise",
    twoMinuteVersion: "Walk to the end of your street and back",
    suggestedStack: "After I finish lunch",
    category: "Health"
  },
  {
    title: "Screen Time Check",
    description: "Monitor and reduce excessive screen usage",
    twoMinuteVersion: "Check your daily screen time and note one insight",
    suggestedStack: "After I have dinner",
    category: "Digital Wellness"
  },
  {
    title: "Mindful Breathing",
    description: "Reduce stress with intentional breathing",
    twoMinuteVersion: "Take 5 deep breaths focusing on exhale",
    suggestedStack: "After I sit at my desk",
    category: "Mindfulness"
  },
  {
    title: "Stretch Break",
    description: "Keep your body flexible and pain-free",
    twoMinuteVersion: "Do 3 shoulder rolls and neck stretches",
    suggestedStack: "After I've been sitting for 2 hours",
    category: "Health"
  },
  
  // Learning & Growth
  {
    title: "Evening Reading",
    description: "Read before bed for better sleep",
    twoMinuteVersion: "Read one page of any book",
    suggestedStack: "After I brush my teeth",
    category: "Learning"
  },
  {
    title: "Share Daily Insight",
    description: "Share one interesting idea you learned today",
    twoMinuteVersion: "Write one sentence about something interesting you discovered",
    suggestedStack: "After I have my evening tea",
    category: "Social Learning"
  },
  {
    title: "Listen to Educational Content",
    description: "Learn something new through audio",
    twoMinuteVersion: "Listen to 2 minutes of a podcast or audiobook",
    suggestedStack: "After I start my commute",
    category: "Learning"
  },
  
  // Digital Wellness
  {
    title: "Phone-Free Meals",
    description: "Eat mindfully without digital distraction",
    twoMinuteVersion: "Put phone in another room before sitting down to eat",
    suggestedStack: "After I prepare my meal",
    category: "Digital Wellness"
  },
  {
    title: "Digital Sunset",
    description: "No screens 1 hour before bed",
    twoMinuteVersion: "Put all devices in charging station",
    suggestedStack: "After I set my clothes for tomorrow",
    category: "Digital Wellness"
  },
  
  // Social & Family
  {
    title: "Family Check-in",
    description: "Connect meaningfully with family members",
    twoMinuteVersion: "Send one thoughtful message to a family member",
    suggestedStack: "After I have my morning coffee",
    category: "Social"
  },
  {
    title: "Gratitude Practice",
    description: "Focus on positive aspects of your day",
    twoMinuteVersion: "Write down one thing you're grateful for",
    suggestedStack: "After I get into bed",
    category: "Mindfulness"
  },
  
  // Productivity & Organization
  {
    title: "Daily Priority Setting",
    description: "Start your day with clear intentions",
    twoMinuteVersion: "Write down your top 3 priorities for today",
    suggestedStack: "After I check my calendar",
    category: "Productivity"
  },
  {
    title: "5-Minute Tidy",
    description: "Keep your space organized and clear",
    twoMinuteVersion: "Put 5 items back in their proper place",
    suggestedStack: "After I finish working",
    category: "Organization"
  },
  {
    title: "Evening Reflection",
    description: "Process your day and plan for tomorrow",
    twoMinuteVersion: "Write one sentence about today's highlight",
    suggestedStack: "After I turn off my work computer",
    category: "Productivity"
  },
  
  // Health & Wellness
  {
    title: "Healthy Snack Choice",
    description: "Choose nutritious options when hungry",
    twoMinuteVersion: "Choose one piece of fruit over processed snack",
    suggestedStack: "After I feel hungry between meals",
    category: "Health"
  },
  {
    title: "Posture Check",
    description: "Maintain good posture throughout the day",
    twoMinuteVersion: "Adjust your sitting position and roll shoulders back",
    suggestedStack: "After I get a notification reminder",
    category: "Health"
  },
  {
    title: "Nature Connection",
    description: "Spend time outdoors for mental health",
    twoMinuteVersion: "Step outside and take 3 deep breaths",
    suggestedStack: "After I finish a work meeting",
    category: "Health"
  },
  
  // Social Learning & Sharing
  {
    title: "Weekly Book/Article Recommendation",
    description: "Share interesting content with family",
    twoMinuteVersion: "Send one article or book title you found interesting",
    suggestedStack: "After I finish reading something good",
    category: "Social Learning"
  },
  {
    title: "Fun Fact Friday",
    description: "Share something interesting you learned",
    twoMinuteVersion: "Share one fascinating fact in family chat",
    suggestedStack: "After I learn something surprising",
    category: "Social Learning"
  }
]
```

#### 4. 3D Medal System & Money Pool
**Files**: `src/rewards/`
- `PointsDisplay.tsx`: Current points with animated counter
- `Medal3DViewer.tsx`: Three.js 3D medal display component
- `MedalCollection.tsx`: Interactive 3D medal showcase
- `WeeklyPoolTracker.tsx`: Money pool status and leaderboard
- `PayoutManager.tsx`: Handle weekly winner distributions

**3D Medal Requirements**:
- **Three.js Integration**: Render 3D medals with proper lighting
- **Medal Models**: 5 distinct 3D models (Bronze to Diamond)
- **Animations**: Rotation, glow effects, particle systems
- **Interactive Viewing**: Click and drag to rotate medals
- **Performance**: Optimized for mobile devices

**Money Pool Requirements**:
- **Weekly Cycles**: Auto-reset every Sunday midnight
- **Contribution Tracking**: $2/week per family member
- **Winner Calculation**: Based on habit completion percentage
- **Payout Integration**: Venmo/PayPal API for automatic distribution
- **Pool Status**: Real-time updates of current pool amount
- **Leaderboard**: Live ranking during the week

**3D Medal Technical Specs**:
```typescript
interface Medal3D {
  id: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  modelUrl: string;
  materialProperties: {
    metalness: number;
    roughness: number;
    color: string;
    emissive?: string;
  };
  animations: {
    rotation: boolean;
    glow: boolean;
    particles: boolean;
  };
  unlockPoints: number;
}
```

#### 5. Data Management & Real-time Updates
**Files**: `src/data/`
- `supabaseClient.ts`: Configured Supabase client
- `habitService.ts`: CRUD operations for habits
- `familyService.ts`: Family management functions
- `pointsService.ts`: Points calculation and tracking
- `realtimeProvider.tsx`: Real-time subscription management

**Requirements**:
- **Real-time Family Feed**: Instant updates when family members complete habits
- **Streak Calculations**: Server-side streak logic with caching
- **Data Persistence**: Offline-capable with sync on reconnect
- **Performance**: Optimistic updates for instant feedback

### KEY IMPLEMENTATION DETAILS

#### Atomic Habits Integration
```typescript
interface Habit {
  id: string;
  title: string;
  description: string;
  twoMinuteVersion: string; // REQUIRED
  habitStack?: string; // "After I [trigger], I will [habit]"
  environmentCue?: string; // Location/context reminder
  category: 'Health' | 'Learning' | 'Productivity' | 'Mindfulness';
  targetFrequency: number; // times per week
}

// Habit completion with immediate satisfaction
const completeHabit = async (habitId: string) => {
  // 1. Optimistic UI update (instant feedback)
  // 2. Calculate points with streak bonus
  // 3. Show celebration animation
  // 4. Update family activity feed
  // 5. Check for milestone achievements
}
```

#### Family Activity Feed Algorithm
```typescript
interface ActivityItem {
  userId: string;
  userName: string;
  habitTitle: string;
  completedAt: Date;
  streakDay: number;
  pointsEarned: number;
  celebrationType: 'normal' | 'streak' | 'milestone';
}

// Real-time feed with celebration logic
const generateFeedItem = (completion: HabitCompletion) => {
  const celebrationType = 
    completion.streakDay % 7 === 0 ? 'streak' :
    completion.pointsEarned >= 50 ? 'milestone' : 'normal';
  
  return {
    message: generateCelebrationMessage(completion, celebrationType),
    animation: getCelebrationAnimation(celebrationType)
  };
}
```

### UI/UX SPECIFICATIONS

#### Color Scheme & Branding
```css
:root {
  --primary-green: #10b981;    /* Success, completion */
  --warm-orange: #f59e0b;      /* Streaks, fire */
  --soft-blue: #3b82f6;        /* Family, social */  
  --purple-accent: #8b5cf6;    /* Rewards, special */
  --gray-background: #f9fafb;  /* Neutral background */
  --text-primary: #111827;     /* Main text */
  --text-secondary: #6b7280;   /* Subtitle text */
}
```

#### Animation Requirements
- **Habit Completion**: 0.5s scale + checkmark animation
- **Streak Fire**: Pulsing flame icon for streaks >3 days
- **Points Counter**: Counting animation for point increases
- **Family Notifications**: Gentle slide-in for new activity

#### Responsive Breakpoints
```css
/* Mobile-first approach */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### TESTING REQUIREMENTS

#### Unit Tests (Jest)
- Habit creation and completion logic
- Points calculation with streak bonuses
- Family invite code generation
- Date/time streak calculations

#### Integration Tests
- Supabase authentication flow
- Real-time subscription updates
- Family activity feed updates
- Habit template loading

#### User Acceptance Tests
1. **Family Onboarding**: New user can join family in <2 minutes
2. **Habit Creation**: User can create habit with 2-minute version in <1 minute
3. **Daily Usage**: Completing habits feels rewarding and takes <30 seconds
4. **Family Engagement**: Family activity appears within 5 seconds
5. **Streak Motivation**: Streak visualization encourages continued use

### DEPLOYMENT CONFIGURATION

#### Vercel Deployment
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Environment Variables
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_APP_NAME=HabitHero
REACT_APP_FAMILY_INVITE_BASE_URL=http://localhost:3000/join
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
REACT_APP_VENMO_API_KEY=your_venmo_api_key
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### SUCCESS CRITERIA FOR MVP 1

#### Technical Metrics
- Page load time <2 seconds
- Habit completion interaction <500ms response
- Real-time updates delivery <5 seconds
- 99% uptime on Vercel/Supabase free tier

#### User Experience Metrics
- Family onboarding completion >90%
- Daily habit completion rate >60%
- Family activity engagement >3 interactions/week per user
- User retention >70% after 4 weeks

#### Family Trial Success Indicators
- 8+ family members successfully onboard
- >5 different habit types actively tracked
- Family challenges completed monthly
- Positive feedback from 80% of family participants

---

## IMPLEMENTATION PRIORITY ORDER

### Week 1-2: Foundation
1. Supabase setup and authentication
2. Basic habit CRUD operations
3. Simple dashboard with today's habits

### Week 3-4: Core Features
1. Habit templates and 2-minute rule implementation
2. Points system and streak calculation
3. Family dashboard and activity feed

### Week 5-6: Polish & Testing
1. Animations and celebration feedback
2. Real-time updates and notifications
3. Family invite system and onboarding flow

### Week 7-8: Family Trial
1. Deploy to Vercel
2. Onboard family members
3. Gather feedback and iterate

**This specification provides complete, unambiguous requirements for building HabitHero MVP 1 focused on your family trial with strong Atomic Habits principles integration.**