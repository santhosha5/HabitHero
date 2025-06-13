import { supabase } from '../lib/supabase';

interface UserMetrics {
  total_habits: number;
  active_habits: number;
  completed_habits: number;
  total_points: number;
  longest_streak: number;
  current_streaks: { habit_id: string; days: number }[];
  completion_rate: number;
  weekly_completion_rate: number;
}

class AnalyticsService {
  /**
   * Track a user event
   */
  public async trackEvent(eventType: string, eventData: any = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No user found when tracking analytics event');
        return false;
      }

      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: eventData
        });

      if (error) {
        console.error('Error tracking analytics event:', error);
        // Don't throw the error, just log it
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Don't throw the error, just log it
      return false;
    }
  }
  
  /**
   * Track page view
   */
  public async trackPageView(path: string) {
    return this.trackEvent('page_view', { path });
  }
  
  /**
   * Track habit creation
   */
  async trackHabitCreation(userId: string, habitId: string, habitData: any): Promise<void> {
    await this.trackEvent('habit_created', {
      habit_id: habitId,
      title: habitData.title,
      category: habitData.category,
      has_two_minute_version: !!habitData.two_minute_version,
      has_habit_stack: !!habitData.habit_stack,
      target_frequency: habitData.target_frequency
    });
  }
  
  /**
   * Track habit completion
   */
  public async trackHabitCompletion(habitId: string, habitTitle: string) {
    return this.trackEvent('habit_completed', { habitId, habitTitle });
  }
  
  /**
   * Track family challenge creation
   */
  async trackChallengeCreation(userId: string, challengeId: string, challengeData: any): Promise<void> {
    await this.trackEvent('challenge_created', {
      challenge_id: challengeId,
      title: challengeData.title,
      challenge_type: challengeData.challenge_type,
      duration_days: this.calculateDays(challengeData.start_date, challengeData.end_date),
      target_value: challengeData.target_value
    });
  }
  
  /**
   * Track challenge join
   */
  async trackChallengeJoin(userId: string, challengeId: string): Promise<void> {
    await this.trackEvent('challenge_joined', { challenge_id: challengeId });
  }
  
  /**
   * Track reward earned
   */
  async trackRewardEarned(userId: string, rewardType: string, rewardValue: number): Promise<void> {
    await this.trackEvent('reward_earned', {
      reward_type: rewardType,
      reward_value: rewardValue
    });
  }
  
  /**
   * Calculate user metrics
   */
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    try {
      // Get total habits count
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, is_active')
        .eq('user_id', userId);
        
      if (habitsError) throw habitsError;
      
      const totalHabits = habits ? habits.length : 0;
      const activeHabits = habits ? habits.filter(h => h.is_active).length : 0;
      
      // Get habit completions
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_at, points_earned')
        .eq('user_id', userId);
        
      if (completionsError) throw completionsError;
      
      const completedHabits = completions ? new Set(completions.map(c => c.habit_id)).size : 0;
      const totalPoints = completions ? completions.reduce((sum, c) => sum + (c.points_earned || 0), 0) : 0;
      
      // Get habit streaks
      const { data: streakData, error: streakError } = await supabase
        .from('habit_streaks')
        .select('habit_id, current_streak, longest_streak')
        .eq('user_id', userId);
        
      if (streakError) throw streakError;
      
      const longestStreak = streakData ? Math.max(...streakData.map(s => s.longest_streak), 0) : 0;
      const currentStreaks = streakData ? streakData.map(s => ({ habit_id: s.habit_id, days: s.current_streak })) : [];
      
      // Calculate completion rate
      const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
      
      // Calculate weekly completion rate
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyCompletions = completions ? completions.filter(c => 
        new Date(c.completed_at) >= oneWeekAgo
      ).length : 0;
      
      const potentialWeeklyCompletions = activeHabits * 7;
      const weeklyCompletionRate = potentialWeeklyCompletions > 0 
        ? (weeklyCompletions / potentialWeeklyCompletions) * 100 
        : 0;
      
      return {
        total_habits: totalHabits,
        active_habits: activeHabits,
        completed_habits: completedHabits,
        total_points: totalPoints,
        longest_streak: longestStreak,
        current_streaks: currentStreaks,
        completion_rate: Math.round(completionRate),
        weekly_completion_rate: Math.round(weeklyCompletionRate)
      };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      return {
        total_habits: 0,
        active_habits: 0,
        completed_habits: 0,
        total_points: 0,
        longest_streak: 0,
        current_streaks: [],
        completion_rate: 0,
        weekly_completion_rate: 0
      };
    }
  }
  
  /**
   * Get family metrics
   */
  async getFamilyMetrics(familyId: string): Promise<any> {
    try {
      // Get family members
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, full_name, total_points')
        .eq('family_id', familyId);
        
      if (membersError) throw membersError;
      
      if (!members || members.length === 0) {
        return {
          member_count: 0,
          total_family_points: 0,
          top_performers: [],
          activity_last_week: 0,
          completion_rate: 0
        };
      }
      
      const memberIds = members.map(m => m.id);
      const totalFamilyPoints = members.reduce((sum, m) => sum + (m.total_points || 0), 0);
      
      // Get activity from last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: recentActivity, error: activityError } = await supabase
        .from('habit_completions')
        .select('user_id, completed_at')
        .in('user_id', memberIds)
        .gte('completed_at', oneWeekAgo.toISOString());
        
      if (activityError) throw activityError;
      
      const activityLastWeek = recentActivity ? recentActivity.length : 0;
      
      // Calculate user completion stats
      const userCompletions: Record<string, number> = {};
      
      if (recentActivity) {
        for (const activity of recentActivity) {
          userCompletions[activity.user_id] = (userCompletions[activity.user_id] || 0) + 1;
        }
      }
      
      // Create top performers list
      const topPerformers = members
        .map(member => ({
          user_id: member.id,
          name: member.full_name,
          completions: userCompletions[member.id] || 0,
          points: member.total_points || 0
        }))
        .sort((a, b) => b.completions - a.completions || b.points - a.points)
        .slice(0, 3);
      
      // Calculate overall family completion rate
      const { data: habitCounts, error: habitCountError } = await supabase
        .from('habits')
        .select('user_id, is_active')
        .in('user_id', memberIds)
        .eq('is_active', true);
        
      if (habitCountError) throw habitCountError;
      
      const activeHabitsPerUser: Record<string, number> = {};
      
      if (habitCounts) {
        for (const habit of habitCounts) {
          activeHabitsPerUser[habit.user_id] = (activeHabitsPerUser[habit.user_id] || 0) + 1;
        }
      }
      
      const totalPotentialCompletions = Object.values(activeHabitsPerUser).reduce((sum, count) => sum + count * 7, 0);
      const familyCompletionRate = totalPotentialCompletions > 0 
        ? (activityLastWeek / totalPotentialCompletions) * 100 
        : 0;
      
      return {
        member_count: members.length,
        total_family_points: totalFamilyPoints,
        top_performers: topPerformers,
        activity_last_week: activityLastWeek,
        completion_rate: Math.round(familyCompletionRate)
      };
    } catch (error) {
      console.error('Error getting family metrics:', error);
      return {
        member_count: 0,
        total_family_points: 0,
        top_performers: [],
        activity_last_week: 0,
        completion_rate: 0
      };
    }
  }
  
  /**
   * Helper to calculate days between dates
   */
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public async trackStreakMilestone(streakCount: number) {
    return this.trackEvent('streak_milestone', { streakCount });
  }

  public async trackMedalEarned(medalType: string) {
    return this.trackEvent('medal_earned', { medalType });
  }

  public async trackFamilyActivity(activityType: string, activityData: any) {
    return this.trackEvent('family_activity', { activityType, ...activityData });
  }
}

export const analyticsService = new AnalyticsService();