import { supabase } from '../lib/supabase';

export interface FamilyChallenge {
  id: string;
  family_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  challenge_type: 'streak' | 'points' | 'completion' | 'custom';
  target_value: number;
  reward_description: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  current_progress: number;
  status: 'joined' | 'completed' | 'failed';
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

class ChallengeService {
  async getFamilyChallenges(familyId: string): Promise<FamilyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('family_challenges')
        .select('*')
        .eq('family_id', familyId)
        .order('start_date', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting family challenges:', error);
      throw error;
    }
  }
  
  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*, users(full_name, avatar_url)')
        .eq('challenge_id', challengeId);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting challenge participants:', error);
      throw error;
    }
  }
  
  async createChallenge(challenge: Omit<FamilyChallenge, 'id' | 'created_at'>): Promise<FamilyChallenge> {
    try {
      const { data, error } = await supabase
        .from('family_challenges')
        .insert(challenge)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }
  
  async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    try {
      const participant = {
        challenge_id: challengeId,
        user_id: userId,
        joined_at: new Date().toISOString(),
        current_progress: 0,
        status: 'joined'
      };
      
      const { data, error } = await supabase
        .from('challenge_participants')
        .insert(participant)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }
  
  async updateChallengeProgress(participantId: string, progress: number): Promise<ChallengeParticipant> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .update({ current_progress: progress })
        .eq('id', participantId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }
  
  async updateChallengeStatus(challengeId: string, status: FamilyChallenge['status']): Promise<FamilyChallenge> {
    try {
      const { data, error } = await supabase
        .from('family_challenges')
        .update({ status })
        .eq('id', challengeId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating challenge status:', error);
      throw error;
    }
  }
  
  async completeChallengeForUser(participantId: string): Promise<ChallengeParticipant> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .update({ status: 'completed' })
        .eq('id', participantId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error completing challenge for user:', error);
      throw error;
    }
  }
  
  async deleteChallenge(challengeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('family_challenges')
        .delete()
        .eq('id', challengeId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }
  
  async getChallengeLeaderboard(challengeId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          id,
          user_id,
          current_progress,
          status,
          users (
            full_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('current_progress', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting challenge leaderboard:', error);
      throw error;
    }
  }
  
  async getActiveUserChallenges(userId: string): Promise<FamilyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          challenge_id,
          family_challenges (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'joined')
        .eq('family_challenges.status', 'active');
        
      if (error) throw error;
      
      // Extract the challenges from the joined data
      return data?.flatMap(item => item.family_challenges) || [];
    } catch (error) {
      console.error('Error getting active user challenges:', error);
      throw error;
    }
  }
}

export const challengeService = new ChallengeService();