import { supabase } from '../lib/supabase';
import { Medal3D, WeeklyPool } from '../types/rewards';

export interface Medal {
  id: string;
  user_id: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: string;
  points_required: number;
  earned_at: string;
  three_d_model_url: string;
  animation_type: string;
}

class RewardsService {
  async getUserMedals(userId: string): Promise<Medal[]> {
    const { data, error } = await supabase
      .from('medals')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching medals:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async getCurrentWeeklyPool(familyId: string): Promise<WeeklyPool | null> {
    const { data, error } = await supabase
      .from('weekly_pools')
      .select('*')
      .eq('family_id', familyId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching weekly pool:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async contributeToPool(userId: string, familyId: string, amount: number): Promise<void> {
    // First get the current pool
    const pool = await this.getCurrentWeeklyPool(familyId);
    
    if (!pool) {
      // Create new pool if none exists
      const { error: createError } = await supabase
        .from('weekly_pools')
        .insert([{
          family_id: familyId,
          week_start: new Date().toISOString(),
          week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          total_amount: amount,
          participants: [userId],
          winners: [],
          status: 'active'
        }]);

      if (createError) throw createError;
    } else {
      // Update existing pool
      const { error: updateError } = await supabase
        .from('weekly_pools')
        .update({
          total_amount: pool.total_amount + amount,
          participants: Array.from(new Set([...pool.participants, userId]))
        })
        .eq('id', pool.id);

      if (updateError) throw updateError;
    }
  }

  async checkAndAwardMedals(userId: string, points: number): Promise<void> {
    const medalThresholds = [
      { type: 'bronze' as const, points: 100 },
      { type: 'silver' as const, points: 500 },
      { type: 'gold' as const, points: 1000 },
      { type: 'platinum' as const, points: 2500 },
      { type: 'diamond' as const, points: 5000 }
    ];

    // Get user's existing medals
    const existingMedals = await this.getUserMedals(userId);
    const existingTypes = new Set(existingMedals.map(m => m.type));

    // Check for new medals
    for (const threshold of medalThresholds) {
      if (points >= threshold.points && !existingTypes.has(threshold.type)) {
        const { error } = await supabase
          .from('medals')
          .insert([{
            user_id: userId,
            type: threshold.type,
            category: 'Overall Achievement',
            points_required: threshold.points,
            earned_at: new Date().toISOString(),
            three_d_model_url: `/medals/${threshold.type}.glb`,
            animation_type: threshold.type === 'diamond' ? 'particle_effect' : 'spin'
          }]);

        if (error) {
          console.error(`Error awarding ${threshold.type} medal:`, error);
        }
      }
    }
  }

  async calculateWeeklyWinners(familyId: string): Promise<void> {
    const pool = await this.getCurrentWeeklyPool(familyId);
    if (!pool) return;

    // Get all family members' habit completion rates for the week
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('user_id, habit_id')
      .gte('completed_at', pool.week_start)
      .lte('completed_at', pool.week_end);

    if (completionsError) throw completionsError;

    // Calculate completion rates
    const userCompletions = new Map<string, number>();
    completions?.forEach(completion => {
      userCompletions.set(
        completion.user_id,
        (userCompletions.get(completion.user_id) || 0) + 1
      );
    });

    // Sort by completion count
    const sortedUsers = Array.from(userCompletions.entries())
      .sort((a, b) => b[1] - a[1]);

    // Calculate payouts
    const winners = sortedUsers.slice(0, 3).map(([userId, completions], index) => ({
      user_id: userId,
      rank: index + 1,
      payout_amount: index === 0 ? pool.total_amount * 0.6 :
                    index === 1 ? pool.total_amount * 0.25 :
                    pool.total_amount * 0.15
    }));

    // Update pool with winners
    const { error: updateError } = await supabase
      .from('weekly_pools')
      .update({
        winners,
        status: 'completed'
      })
      .eq('id', pool.id);

    if (updateError) throw updateError;
  }
}

export const rewardsService = new RewardsService(); 