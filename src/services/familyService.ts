import { supabase, supabaseAdmin } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface FamilyMember {
  id: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  preferred_habits?: string[];
}

export interface FamilyDetails {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface FamilyActivity {
  id: string;
  user_id: string;
  user_name: string;
  activity_type: 'habit_completed' | 'streak_milestone' | 'joined_family' | 'medal_earned';
  activity_data: {
    habit_id?: string;
    habit_title?: string;
    streak_count?: number;
    medal_type?: string;
  };
  created_at: string;
}

export interface FamilyCalendarEvent {
  id: string;
  user_id: string;
  user_name: string;
  habit_id: string;
  habit_title: string;
  habit_category: string;
  scheduled_date: string;
  is_completed: boolean;
}

interface FamilyActivityJoinResult {
  id: string;
  user_id: string;
  activity_type: 'habit_completed' | 'streak_milestone' | 'joined_family' | 'medal_earned';
  activity_data: {
    habit_id?: string;
    habit_title?: string;
    streak_count?: number;
    medal_type?: string;
  };
  created_at: string;
  users: {
    full_name: string;
  };
}

interface Profile {
  full_name: string;
  avatar_url?: string;
}

interface FamilyMemberRow {
  user_id: string;
  profiles: Profile[];  // Changed to array since it's a foreign key relation
  total_points: number;
  preferred_habits: string[];
}

interface FamilyActivityRow {
  id: string;
  user_id: string;
  profiles: Profile[];  // Changed to array since it's a foreign key relation
  activity_type: 'habit_completed' | 'streak_milestone' | 'joined_family' | 'medal_earned';
  activity_data: {
    habit_id?: string;
    habit_title?: string;
    streak_count?: number;
    medal_type?: string;
  };
  created_at: string;
}

interface FamilyCalendarEventRow {
  id: string;
  user_id: string;
  profiles: Profile[];  // Changed to array since it's a foreign key relation
  habit_id: string;
  habits: {  // Changed to array since it's a foreign key relation
    title: string;
    category: string;
  }[];
  scheduled_date: string;
  is_completed: boolean;
}

export class FamilyService {
  private readonly supabaseClient;

  constructor() {
    this.supabaseClient = supabase;
  }

  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    // First get the user's family ID
    const { data: userFamily, error: userError } = await this.supabaseClient
      .from('users')
      .select('family_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error getting user family:', userError);
      return [];
    }

    if (!userFamily?.family_id) {
      return [];
    }

    // Then get all family members
    const { data: members, error: membersError } = await this.supabaseClient
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        total_points
      `)
      .eq('family_id', userFamily.family_id);

    if (membersError) {
      console.error('Error getting family members:', membersError);
      throw membersError;
    }

    return (members || []).map(member => ({
      id: member.id,
      full_name: member.full_name || 'Anonymous',
      avatar_url: member.avatar_url,
      total_points: member.total_points || 0,
      preferred_habits: [] // This field is no longer used
    }));
  }

  async getFamilyDetails(userId: string): Promise<FamilyDetails | null> {
    // First get the user's family ID
    const { data: userFamily, error: userError } = await this.supabaseClient
      .from('users')
      .select('family_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error getting user family:', userError);
      return null;
    }

    if (!userFamily?.family_id) {
      return null;
    }

    // Then get the family details and member count
    const { data: family, error: familyError } = await this.supabaseClient
      .from('families')
      .select('*')
      .eq('id', userFamily.family_id)
      .single();

    if (familyError) {
      console.error('Error getting family:', familyError);
      return null;
    }

    // Get member count separately
    const { data: members, error: memberError } = await this.supabaseClient
      .from('users')
      .select('id')
      .eq('family_id', family.id);

    if (memberError) {
      console.error('Error getting family members:', memberError);
      throw memberError;
    }

    return {
      id: family.id,
      name: family.name,
      invite_code: family.invite_code,
      created_by: family.created_by,
      created_at: family.created_at,
      member_count: members?.length || 0
    };
  }

  async getFamilyActivities(familyId: string, limit = 10): Promise<FamilyActivity[]> {
    const { data, error } = await this.supabaseClient
      .from('family_activities')
      .select(`
        id,
        user_id,
        profiles (full_name),
        activity_type,
        activity_data,
        created_at
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data as FamilyActivityRow[]).map(activity => ({
      id: activity.id,
      user_id: activity.user_id,
      user_name: activity.profiles[0]?.full_name,  // Access first profile since it's now an array
      activity_type: activity.activity_type,
      activity_data: activity.activity_data,
      created_at: activity.created_at
    }));
  }

  async getCalendarEvents(familyId: string): Promise<FamilyCalendarEvent[]> {
    const { data, error } = await this.supabaseClient
      .from('family_calendar_events')
      .select(`
        id,
        user_id,
        profiles (full_name),
        habit_id,
        habits (title, category),
        scheduled_date,
        is_completed
      `)
      .eq('family_id', familyId)
      .gte('scheduled_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    return (data as FamilyCalendarEventRow[]).map(event => ({
      id: event.id,
      user_id: event.user_id,
      user_name: event.profiles[0]?.full_name,  // Access first profile since it's now an array
      habit_id: event.habit_id,
      habit_title: event.habits[0]?.title,  // Access first habit since it's now an array
      habit_category: event.habits[0]?.category,  // Access first habit since it's now an array
      scheduled_date: event.scheduled_date,
      is_completed: event.is_completed
    }));
  }

  async getInviteLink(userId: string): Promise<string | null> {
    const familyDetails = await this.getFamilyDetails(userId);
    
    if (!familyDetails) {
      return null;
    }
    
    // Create a shareable link with the invite code
    const baseUrl = window.location.origin;
    return `${baseUrl}/family/join?code=${familyDetails.invite_code}`;
  }

  async shareInviteByEmail(
    userId: string, 
    recipientEmail: string, 
    familyDetails: FamilyDetails
  ): Promise<void> {
    try {
      // Get user details
      const { data: userData, error: userError } = await this.supabaseClient
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        throw new Error('Failed to fetch user details');
      }

      // Create family invite record first
      const { error: inviteError } = await this.supabaseClient
        .from('family_invites')
        .insert([{
          family_id: familyDetails.id,
          invited_by: userId,
          email: recipientEmail,
          invite_code: familyDetails.invite_code
        }]);

      if (inviteError) {
        console.error('Error creating invite:', inviteError);
        throw new Error('Failed to create invite');
      }

      // Call edge function using admin client
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available');
      }

      const { error: functionError } = await supabaseAdmin.functions.invoke('send-invite-email', {
        body: {
          recipientEmail,
          inviteCode: familyDetails.invite_code,
          familyName: familyDetails.name,
          inviterName: userData.full_name || 'A family member'
        }
      });

      if (functionError) {
        console.error('Error in Edge Function:', functionError);
        throw functionError;
      }
    } catch (error) {
      console.error('Error in shareInviteByEmail:', error);
      throw error;
    }
  }

  async getFamilyActivity(userId: string, limit = 10): Promise<FamilyActivity[]> {
    const familyDetails = await this.getFamilyDetails(userId);
    
    if (!familyDetails) {
      return [];
    }
    
    // Get family activity feed with user names using foreign key relationship
    const { data, error } = await this.supabaseClient
      .from('family_activity')
      .select(`
        id,
        user_id,
        activity_type,
        activity_data,
        created_at,
        users!inner (full_name)
      `)
      .eq('family_id', familyDetails.id)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: FamilyActivityJoinResult[] | null, error: Error | null };

    if (error) {
      console.error('Error fetching family activity:', error);
      throw new Error('Failed to load family activity');
    }

    // Format the data
    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.users.full_name || 'Unknown User',
      activity_type: item.activity_type,
      activity_data: item.activity_data,
      created_at: item.created_at
    }));
  }

  async getFamilyCalendar(userId: string, startDate: string, endDate: string): Promise<FamilyCalendarEvent[]> {
    const familyDetails = await this.getFamilyDetails(userId);
    
    if (!familyDetails) {
      return [];
    }
    
    // Get family members
    const { data: members, error: membersError } = await this.supabaseClient
      .from('users')
      .select('id, full_name')
      .eq('family_id', familyDetails.id);

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      throw new Error('Failed to load family members');
    }
    
    if (!members || members.length === 0) {
      return [];
    }
    
    // Get all member IDs
    const memberIds = members.map(m => m.id);
    
    // Get habits for all members
    const { data: habits, error: habitsError } = await this.supabaseClient
      .from('habits')
      .select('id, user_id, title, category, target_frequency')
      .in('user_id', memberIds)
      .eq('is_active', true);

    if (habitsError) {
      console.error('Error fetching family habits:', habitsError);
      throw new Error('Failed to load family habits');
    }
    
    // Get completions for the date range
    const { data: completions, error: completionsError } = await this.supabaseClient
      .from('habit_completions')
      .select('habit_id, completed_at')
      .in('user_id', memberIds)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate);

    if (completionsError) {
      console.error('Error fetching habit completions:', completionsError);
      throw new Error('Failed to load habit completions');
    }
    
    // Create a map of member names
    const memberNameMap: Record<string, string> = {};
    members.forEach(m => {
      memberNameMap[m.id] = m.full_name;
    });
    
    // Create a map of completed habits
    const completedHabitsMap: Record<string, Record<string, boolean>> = {};
    (completions || []).forEach(c => {
      const date = c.completed_at.split('T')[0];
      if (!completedHabitsMap[date]) {
        completedHabitsMap[date] = {};
      }
      completedHabitsMap[date][c.habit_id] = true;
    });
    
    // Generate calendar events
    const calendarEvents: FamilyCalendarEvent[] = [];
    
    // Generate a sequence of dates in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange: string[] = [];
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dateRange.push(date.toISOString().split('T')[0]);
    }
    
    // For each habit, create events on appropriate days based on frequency
    (habits || []).forEach(habit => {
      // Determine which days of the week this habit should be scheduled for
      const daysToSchedule = this.getDaysToScheduleForFrequency(habit.target_frequency);
      
      dateRange.forEach(date => {
        const dayOfWeek = new Date(date).getDay();
        
        // Check if this habit should be scheduled for this day
        if (daysToSchedule.includes(dayOfWeek)) {
          const isCompleted = completedHabitsMap[date]?.[habit.id] || false;
          
          calendarEvents.push({
            id: `${habit.id}-${date}`,
            user_id: habit.user_id,
            user_name: memberNameMap[habit.user_id] || 'Unknown User',
            habit_id: habit.id,
            habit_title: habit.title,
            habit_category: habit.category,
            scheduled_date: date,
            is_completed: isCompleted
          });
        }
      });
    });
    
    return calendarEvents;
  }
  
  private getDaysToScheduleForFrequency(frequency: number): number[] {
    // Simple algorithm to distribute habit days throughout the week
    // For different frequencies
    switch (frequency) {
      case 1: return [1]; // Monday
      case 2: return [1, 4]; // Monday, Thursday
      case 3: return [1, 3, 5]; // Monday, Wednesday, Friday
      case 4: return [1, 2, 4, 6]; // Monday, Tuesday, Thursday, Saturday
      case 5: return [1, 2, 3, 4, 5]; // Monday through Friday
      case 6: return [1, 2, 3, 4, 5, 6]; // Monday through Saturday
      case 7: return [0, 1, 2, 3, 4, 5, 6]; // Every day
      default: return [1]; // Default to Monday
    }
  }

  async getFamilyHabitSuggestions(userId: string): Promise<string[]> {
    const familyMembers = await this.getFamilyMembers(userId);
    
    if (familyMembers.length <= 1) {
      return [
        "No family members yet! Invite someone to see their habits.",
        "Start your family habit journey by inviting members."
      ];
    }
    
    // Collect all preferred habits
    const allHabits: string[] = [];
    familyMembers.forEach(member => {
      if (member.id !== userId && member.preferred_habits) {
        allHabits.push(...(member.preferred_habits || []));
      }
    });
    
    // Count habit occurrences
    const habitCounts: Record<string, number> = {};
    allHabits.forEach(habit => {
      habitCounts[habit] = (habitCounts[habit] || 0) + 1;
    });
    
    // Sort by popularity
    const sortedHabits = Object.entries(habitCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([habit, count]) => {
        const memberCount = count > 1 ? `${count} family members` : "1 family member";
        return `${habit} (${memberCount})`;
      });
    
    return sortedHabits.length > 0 
      ? sortedHabits.slice(0, 5) 
      : ["Family members haven't created habits yet."];
  }
}

// Create and export a singleton instance
export const familyService = new FamilyService();