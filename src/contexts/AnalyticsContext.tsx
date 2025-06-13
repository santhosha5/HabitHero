import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackHabitCreation: (habitId: string, habitData: any) => void;
  trackHabitCompletion: (habitId: string, habitTitle: string) => void;
  trackChallengeCreation: (challengeId: string, challengeData: any) => void;
  trackChallengeJoin: (challengeId: string) => void;
  trackRewardEarned: (rewardType: string, rewardValue: number) => void;
  trackStreakMilestone: (streakCount: number) => void;
  trackMedalEarned: (medalType: string) => void;
  trackFamilyActivity: (activityType: string, activityData: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user?.id && initialized) {
      analyticsService.trackPageView(location.pathname);
    }
  }, [location.pathname, user?.id, initialized]);

  useEffect(() => {
    setInitialized(true);
  }, []);

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (!user?.id) return;
    
    analyticsService.trackEvent(eventName, properties);
  };

  const trackHabitCreation = (habitId: string, habitData: any) => {
    if (!user?.id) return;
    
    analyticsService.trackHabitCreation(user.id, habitId, habitData);
  };

  const trackHabitCompletion = (habitId: string, habitTitle: string) => {
    if (!user?.id) return;
    
    analyticsService.trackHabitCompletion(habitId, habitTitle);
  };

  const trackChallengeCreation = (challengeId: string, challengeData: any) => {
    if (!user?.id) return;
    
    analyticsService.trackChallengeCreation(user.id, challengeId, challengeData);
  };

  const trackChallengeJoin = (challengeId: string) => {
    if (!user?.id) return;
    
    analyticsService.trackChallengeJoin(user.id, challengeId);
  };

  const trackRewardEarned = (rewardType: string, rewardValue: number) => {
    if (!user?.id) return;
    
    analyticsService.trackRewardEarned(user.id, rewardType, rewardValue);
  };

  const trackStreakMilestone = (streakCount: number) => {
    analyticsService.trackStreakMilestone(streakCount);
  };

  const trackMedalEarned = (medalType: string) => {
    analyticsService.trackMedalEarned(medalType);
  };

  const trackFamilyActivity = (activityType: string, activityData: any) => {
    analyticsService.trackFamilyActivity(activityType, activityData);
  };

  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        trackHabitCreation,
        trackHabitCompletion,
        trackChallengeCreation,
        trackChallengeJoin,
        trackRewardEarned,
        trackStreakMilestone,
        trackMedalEarned,
        trackFamilyActivity
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};