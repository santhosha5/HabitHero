import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  subscribeToFamily: (familyId: string, callback: (payload: any) => void) => () => void;
  subscribeToHabits: (userId: string, callback: (payload: any) => void) => () => void;
  subscribeToFamilyActivity: (familyId: string, callback: (payload: any) => void) => () => void;
  subscribeToWeeklyPool: (familyId: string, callback: (payload: any) => void) => () => void;
  subscribeToFamilyChallenges: (familyId: string, callback: (payload: any) => void) => () => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Clean up all channels when component unmounts
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      channelsRef.current = [];
    };
  }, []);

  // Monitor connection status
  useEffect(() => {
    if (!user) return;

    const connectionChannel = supabase.channel('system');
    
    connectionChannel
      .on('system', { event: 'health' }, (payload) => {
        setIsConnected(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      connectionChannel.unsubscribe();
    };
  }, [user]);

  const subscribeToFamily = (familyId: string, callback: (payload: any) => void) => {
    const channelName = `family:${familyId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'families',
          filter: `id=eq.${familyId}`
        },
        callback
      )
      .subscribe();
    
    channelsRef.current.push(channel);
    
    return () => {
      channel.unsubscribe();
      channelsRef.current = channelsRef.current.filter(ch => ch !== channel);
    };
  };

  const subscribeToHabits = (userId: string, callback: (payload: any) => void) => {
    const channelName = `habits:${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_completions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
    
    channelsRef.current.push(channel);
    
    return () => {
      channel.unsubscribe();
      channelsRef.current = channelsRef.current.filter(ch => ch !== channel);
    };
  };

  const subscribeToFamilyActivity = (familyId: string, callback: (payload: any) => void) => {
    const channelName = `family_activity:${familyId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_activity',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe();
    
    channelsRef.current.push(channel);
    
    return () => {
      channel.unsubscribe();
      channelsRef.current = channelsRef.current.filter(ch => ch !== channel);
    };
  };

  const subscribeToWeeklyPool = (familyId: string, callback: (payload: any) => void) => {
    const channelName = `weekly_pool:${familyId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_pools',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe();
    
    channelsRef.current.push(channel);
    
    return () => {
      channel.unsubscribe();
      channelsRef.current = channelsRef.current.filter(ch => ch !== channel);
    };
  };

  const subscribeToFamilyChallenges = (familyId: string, callback: (payload: any) => void) => {
    const channelName = `family_challenges:${familyId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_challenges',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe();
    
    channelsRef.current.push(channel);
    
    return () => {
      channel.unsubscribe();
      channelsRef.current = channelsRef.current.filter(ch => ch !== channel);
    };
  };

  const value = {
    subscribeToFamily,
    subscribeToHabits,
    subscribeToFamilyActivity,
    subscribeToWeeklyPool,
    subscribeToFamilyChallenges,
    isConnected
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}