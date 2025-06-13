import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { TrophyIcon, CurrencyDollarIcon, FireIcon, UserGroupIcon, SparklesIcon, ArrowTrendingUpIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon, SparklesIcon as SparklesSolidIcon, FireIcon as FireSolidIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import MedalCollection from './MedalCollection';
import Layout from '../../components/Layout';
import confetti from 'canvas-confetti';

interface Medal {
  id: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: string;
  points_required: number;
  earned_at: string;
  three_d_model_url: string;
  animation_type: string;
}

interface WeeklyPool {
  id: string;
  family_id: string;
  week_start: string;
  week_end: string;
  total_amount: number;
  participants: string[];
  winners: any[];
  status: 'active' | 'completed' | 'paid_out';
}

// Helper function to trigger confetti
const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  const interval: NodeJS.Timeout = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Random colors
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#E5E4E2', '#B9F2FF'],
    });
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#CD7F32', '#C0C0C0', '#10b981'],
    });
  }, 250);
};

export default function Rewards() {
  const { user } = useAuth();
  const [medals, setMedals] = useState<Medal[]>([]);
  const [weeklyPools, setWeeklyPools] = useState<WeeklyPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<'medals' | 'leaderboard' | 'stats'>('medals');
  const [pointsHistory, setPointsHistory] = useState<{date: string; points: number}[]>([]);
  const [isAnimated, setIsAnimated] = useState(false);
  
  const statsRef = useRef(null);
  const medalRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 });
  const isMedalInView = useInView(medalRef, { once: true, amount: 0.3 });

  // Effect to trigger confetti when medals are in view
  useEffect(() => {
    if (isMedalInView && !isAnimated && medals.length > 0) {
      setIsAnimated(true);
      setTimeout(() => {
        triggerConfetti();
      }, 800);
    }
  }, [isMedalInView, medals.length, isAnimated]);

  useEffect(() => {
    const loadRewards = async () => {
      if (!user?.id) return;

      try {
        // Get user's points and stats
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching user points:', userError);
          toast.error('Failed to load user points');
          return;
        }

        setUserPoints(userData?.total_points || 0);
        
        // Generate fake points history for demonstration
        const today = new Date();
        const history = [];
        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const formattedDate = date.toISOString().split('T')[0];
          const randomPoints = Math.floor(Math.random() * 30) + 5;
          history.push({ date: formattedDate, points: randomPoints });
        }
        setPointsHistory(history);
        
        // Get user's habits for stats
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('streak_count')
          .eq('user_id', user.id);
          
        if (habitsError) {
          console.error('Error fetching habits:', habitsError);
        } else {
          const maxStreak = habits?.reduce((max, h) => Math.max(max, h.streak_count || 0), 0) || 0;
          setLongestStreak(maxStreak);
        }
        
        // Get habit completions count
        const { count, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (completionsError) {
          console.error('Error fetching completions:', completionsError);
        } else {
          setTotalCompletions(count || 0);
        }

        // Get active weekly pools
        const { data: pools, error: poolsError } = await supabase
          .from('weekly_pools')
          .select('*')
          .eq('status', 'active')
          .order('week_start', { ascending: true });

        if (poolsError) {
          console.error('Error fetching weekly pools:', poolsError);
          toast.error('Failed to load weekly pools');
          return;
        }

        setWeeklyPools(pools || []);

        // Load user's medals
        const { data: medalsData, error: medalsError } = await supabase
          .from('medals')
          .select('*')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });

        if (medalsError) throw medalsError;
        setMedals(medalsData || []);
      } catch (error: any) {
        console.error('Error loading rewards:', error);
        toast.error('Failed to load rewards');
      } finally {
        setIsLoading(false);
      }
    };

    loadRewards();
  }, [user?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="animate-pulse"
          >
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-24 bg-gray-200 rounded-lg"
                ></motion.div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </motion.div>
        </div>
      </Layout>
    );
  }
  
  // Calculate progress to next medal
  const calculateNextMedalProgress = () => {
    const medalThresholds = [100, 500, 1000, 2500, 5000];
    let nextThreshold = 0;
    
    for (const threshold of medalThresholds) {
      if (userPoints < threshold) {
        nextThreshold = threshold;
        break;
      }
    }
    
    if (nextThreshold === 0) return 100; // All medals earned
    
    const prevThreshold = medalThresholds[medalThresholds.indexOf(nextThreshold) - 1] || 0;
    const progressPercentage = ((userPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <SparklesSolidIcon className="h-8 w-8 text-yellow-500 mr-2" />
                Achievements & Rewards
              </h1>
              <p className="text-gray-600 mt-2">Track your progress and earn rewards for consistency</p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg shadow-md"
            >
              <TrophySolidIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Total: {userPoints.toLocaleString()} points</span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Tab navigation */}
        <div className="flex mb-8 border-b border-gray-200 overflow-x-auto">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('medals')}
            className={`px-4 py-2 font-medium text-sm mr-4 border-b-2 ${
              activeTab === 'medals' 
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <TrophyIcon className="h-5 w-5 mr-1" />
              Medal Collection
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-medium text-sm mr-4 border-b-2 ${
              activeTab === 'leaderboard' 
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-1" />
              Weekly Rewards
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === 'stats' 
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-1" />
              Your Progress
            </div>
          </motion.button>
        </div>
      
        {/* Stats Cards */}
        <div ref={statsRef}>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isStatsInView ? { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } : {}}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate={isStatsInView ? "visible" : "hidden"}
              className="bg-white shadow rounded-lg p-6 border-l-4 border-primary-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Total Points</h2>
                  <motion.p
                    initial={{ scale: 1 }}
                    animate={{ scale: isStatsInView ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-1 text-3xl font-bold text-gray-900"
                  >
                    {userPoints.toLocaleString()}
                  </motion.p>
                </div>
                <div className="bg-primary-100 p-3 rounded-full">
                  <TrophySolidIcon className="h-6 w-6 text-primary-500" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate={isStatsInView ? "visible" : "hidden"}
              transition={{ delay: 0.1 }}
              className="bg-white shadow rounded-lg p-6 border-l-4 border-orange-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Longest Streak</h2>
                  <motion.p
                    initial={{ scale: 1 }}
                    animate={{ scale: isStatsInView ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-1 text-3xl font-bold text-gray-900"
                  >
                    {longestStreak} days
                  </motion.p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FireIcon className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate={isStatsInView ? "visible" : "hidden"}
              transition={{ delay: 0.2 }}
              className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Weekly Pool</h2>
                  <motion.p
                    initial={{ scale: 1 }}
                    animate={{ scale: isStatsInView ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-1 text-3xl font-bold text-gray-900"
                  >
                    ${weeklyPools.reduce((total, pool) => total + pool.total_amount, 0).toFixed(2)}
                  </motion.p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {weeklyPools.reduce((total, pool) => total + pool.participants.length, 0)} active participants
              </p>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate={isStatsInView ? "visible" : "hidden"}
              transition={{ delay: 0.3 }}
              className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Total Completions</h2>
                  <motion.p
                    initial={{ scale: 1 }}
                    animate={{ scale: isStatsInView ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-1 text-3xl font-bold text-gray-900"
                  >
                    {totalCompletions}
                  </motion.p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <SparklesIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic content based on active tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'medals' && (
            <motion.div
              key="medals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              ref={medalRef}
            >
              {/* Next Medal Progress */}
              {medals.length < 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-lg shadow-lg p-6 mb-8"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AcademicCapIcon className="h-6 w-6 text-primary-500 mr-2" />
                    Your Journey to the Next Medal
                  </h3>
                  <div className="flex items-center">
                    <div className="bg-primary-100 rounded-full p-4 mr-4">
                      <SparklesIcon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {medals.length === 0 ? "Bronze Medal - First Steps" : 
                         medals.length === 1 ? "Silver Medal - Consistency Builder" :
                         medals.length === 2 ? "Gold Medal - Habit Master" :
                         medals.length === 3 ? "Platinum Medal - Discipline Champion" :
                         "Diamond Medal - Lifestyle Transformer"}
                      </p>
                      
                      <div className="relative pt-1 mt-2">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                              {calculateNextMedalProgress().toFixed(0)}% Complete
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-primary-600">
                              {userPoints} / {medals.length === 0 ? 100 : medals.length === 1 ? 500 : medals.length === 2 ? 1000 : medals.length === 3 ? 2500 : 5000} points
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateNextMedalProgress()}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                          ></motion.div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        Keep going! {medals.length === 0 ? "Complete your first 5 habits" : 
                         medals.length === 1 ? "Maintain a 7-day streak" :
                         medals.length === 2 ? "Complete 50 habits" :
                         medals.length === 3 ? "Maintain a 30-day streak" :
                         "Complete 100 habits with family"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Medals Collection */}
              <MedalCollection earnedMedals={medals.map(m => m.type)} />
            </motion.div>
          )}
          
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Weekly Money Pool */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 bg-gradient-to-r from-green-500 to-teal-500 shadow-lg rounded-lg overflow-hidden"
              >
                <div className="p-6 md:p-8 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 flex items-center">
                        <CurrencyDollarIcon className="h-6 w-6 mr-2" />
                        Weekly Family Challenge
                      </h2>
                      <p className="text-green-100 mb-4">Complete your habits consistently to win the weekly pool</p>
                      
                      <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">
                            ${weeklyPools.reduce((total, pool) => total + pool.total_amount, 0).toFixed(2)}
                          </span>
                          <span className="ml-2 text-green-100">current pool</span>
                        </div>
                        
                        <div className="mt-4 flex items-center">
                          <UserGroupIcon className="h-5 w-5 mr-2 text-green-100" />
                          <span className="text-green-100">
                            {weeklyPools.reduce((total, pool) => total + pool.participants.length, 0)} participants
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 md:mt-0">
                      <motion.div
                        className="relative"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                          <TrophySolidIcon className="w-12 h-12 md:w-16 md:h-16 text-yellow-300" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-8 w-8 flex items-center justify-center">
                          5d
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">1st Place:</span>
                      <span className="text-gray-600 ml-1">60% of pool</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">2nd Place:</span>
                      <span className="text-gray-600 ml-1">25% of pool</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">3rd Place:</span>
                      <span className="text-gray-600 ml-1">15% of pool</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Family Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-lg p-6 mb-8"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <FireSolidIcon className="h-6 w-6 text-orange-500 mr-2" />
                  Family Leaderboard
                </h3>
                
                <div className="overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {[
                      { name: "Sarah J.", points: 3450, streak: 15, position: 1 },
                      { name: "You", points: userPoints, streak: longestStreak, position: 2, isUser: true },
                      { name: "Michael T.", points: 2120, streak: 8, position: 3 },
                      { name: "Jessica R.", points: 1780, streak: 6, position: 4 },
                      { name: "David L.", points: 1230, streak: 4, position: 5 }
                    ].map((member, idx) => (
                      <motion.li 
                        key={idx}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * idx }}
                        className={`flex items-center py-4 ${member.isUser ? 'bg-primary-50 rounded-lg px-3' : ''}`}
                      >
                        <div className="flex-shrink-0 mr-4 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold">
                          {member.position}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${member.isUser ? 'text-primary-700' : 'text-gray-900'}`}>
                            {member.name} {member.isUser && <span className="text-xs text-primary-500">(you)</span>}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.points.toLocaleString()} points • {member.streak} day streak
                          </p>
                        </div>
                        <div>
                          {member.position === 1 && (
                            <TrophySolidIcon className="h-6 w-6 text-yellow-500" />
                          )}
                          {member.position === 2 && (
                            <TrophySolidIcon className="h-6 w-6 text-gray-400" />
                          )}
                          {member.position === 3 && (
                            <TrophySolidIcon className="h-6 w-6 text-amber-700" />
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Points trend chart */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Points Earned (Last 30 Days)</h3>
                <div className="h-64">
                  <div className="h-full flex items-end space-x-2">
                    {pointsHistory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="relative flex flex-col items-center group"
                        style={{ height: '100%', width: `${100 / pointsHistory.length}%` }}
                      >
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${(item.points / 50) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.01 * idx }}
                          className={`w-full max-w-[15px] rounded-t ${
                            idx === pointsHistory.length - 1 
                              ? 'bg-primary-500' 
                              : 'bg-primary-200'
                          }`}
                        />
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 invisible group-hover:visible mt-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {item.points} pts
                        </div>
                        {idx % 5 === 0 && (
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Achievement statistics */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Achievement Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Medals Earned</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(medals.length / 5) * 100}%` }}
                              transition={{ duration: 0.8 }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold inline-block text-primary-600">
                              {medals.length} / 5 Medals
                            </span>
                            <span className="text-xs font-semibold inline-block text-primary-600">
                              {Math.round((medals.length / 5) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Streak Goal</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (longestStreak / 30) * 100)}%` }}
                              transition={{ duration: 0.8 }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold inline-block text-orange-600">
                              {longestStreak} / 30 Days
                            </span>
                            <span className="text-xs font-semibold inline-block text-orange-600">
                              {Math.round(Math.min(100, (longestStreak / 30) * 100))}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Completions</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (totalCompletions / 100) * 100)}%` }}
                              transition={{ duration: 0.8 }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold inline-block text-purple-600">
                              {totalCompletions} / 100 Completions
                            </span>
                            <span className="text-xs font-semibold inline-block text-purple-600">
                              {Math.round(Math.min(100, (totalCompletions / 100) * 100))}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Points Goal</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (userPoints / 5000) * 100)}%` }}
                              transition={{ duration: 0.8 }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold inline-block text-green-600">
                              {userPoints.toLocaleString()} / 5,000 Points
                            </span>
                            <span className="text-xs font-semibold inline-block text-green-600">
                              {Math.round(Math.min(100, (userPoints / 5000) * 100))}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}