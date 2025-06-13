import { supabase } from '../lib/supabase';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  two_minute_version: string;
  habit_stack?: string;
  category: string;
  target_frequency: number;
  is_active: boolean;
  created_at?: string;
  streak_count?: number;
  last_completed?: string;
  locations?: HabitLocation[];
}

export interface HabitLocation {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  points_earned: number;
  streak_day: number;
}

class HabitService {
  async getUserHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async createHabit(habit: Omit<Habit, 'id' | 'created_at'>): Promise<Habit> {
    // Validate required fields
    if (!habit.user_id) {
      throw new Error('User ID is required');
    }
    if (!habit.title) {
      throw new Error('Habit title is required');
    }
    if (!habit.two_minute_version) {
      throw new Error('Two-minute version is required');
    }
    if (!habit.category) {
      throw new Error('Category is required');
    }
    if (!habit.target_frequency) {
      throw new Error('Target frequency is required');
    }

    // Separate locations from habit data for insert
    const { locations, ...habitData } = habit;
    
    const { data, error } = await supabase
      .from('habits')
      .insert([{
        ...habitData,
        is_active: true,
        streak_count: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      if (error.code === '23503') {
        throw new Error('User not found. Please complete your profile setup first.');
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to create habit');
    }

    // If locations are provided, save them
    if (locations && locations.length > 0) {
      await this.saveHabitLocations(data.id, locations);
    }

    return data;
  }

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
    // Separate locations from updates
    const { locations, ...habitUpdates } = updates;
    
    const { data, error } = await supabase
      .from('habits')
      .update(habitUpdates)
      .eq('id', habitId)
      .select()
      .single();

    if (error) throw error;
    
    // If locations are provided, update them
    if (locations) {
      await this.saveHabitLocations(habitId, locations);
    }
    
    return data;
  }

  async deleteHabit(habitId: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) throw error;
  }

  async completeHabit(habitId: string, userId: string): Promise<void> {
    // Start a transaction
    const { error: completionError } = await supabase
      .from('habit_completions')
      .insert([{
        habit_id: habitId,
        user_id: userId,
        completed_at: new Date().toISOString(),
        points_earned: 10, // Base points
      }]);

    if (completionError) throw completionError;

    // Update streak count
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('streak_count, last_completed')
      .eq('id', habitId)
      .single();

    if (habitError) throw habitError;

    const now = new Date();
    const lastCompleted = habit.last_completed ? new Date(habit.last_completed) : null;
    const streakCount = habit.streak_count || 0;

    // Check if the last completion was yesterday
    const isConsecutiveDay = lastCompleted && 
      now.getDate() - lastCompleted.getDate() === 1 &&
      now.getMonth() === lastCompleted.getMonth() &&
      now.getFullYear() === lastCompleted.getFullYear();

    const newStreakCount = isConsecutiveDay ? streakCount + 1 : 1;

    const { error: updateError } = await supabase
      .from('habits')
      .update({
        streak_count: newStreakCount,
        last_completed: now.toISOString(),
      })
      .eq('id', habitId);

    if (updateError) throw updateError;
  }

  async getHabitStreak(habitId: string): Promise<number> {
    const { data, error } = await supabase
      .from('habits')
      .select('streak_count')
      .eq('id', habitId)
      .single();

    if (error) throw error;
    return data?.streak_count || 0;
  }

  // Get habit completions for a user
  async getHabitCompletions(userId: string): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data;
  }
  
  // Save habit locations
  async saveHabitLocations(habitId: string, locations: HabitLocation[]): Promise<void> {
    // First delete existing locations for this habit
    const { error: deleteError } = await supabase
      .from('habit_locations')
      .delete()
      .eq('habit_id', habitId);
      
    if (deleteError) throw deleteError;
    
    // If we have new locations, insert them
    if (locations.length > 0) {
      const locationsToInsert = locations.map(location => ({
        habit_id: habitId,
        name: location.name,
        address: location.address || null,
        latitude: location.latitude || null,
        longitude: location.longitude || null
      }));
      
      const { error: insertError } = await supabase
        .from('habit_locations')
        .insert(locationsToInsert);
        
      if (insertError) throw insertError;
    }
  }
  
  // Get habit locations
  async getHabitLocations(habitId: string): Promise<HabitLocation[]> {
    const { data, error } = await supabase
      .from('habit_locations')
      .select('*')
      .eq('habit_id', habitId);
      
    if (error) throw error;
    return data || [];
  }
}

export const habitService = new HabitService(); 