import { supabase } from '../lib/supabase';
import localforage from 'localforage';
import { Mutex } from 'async-mutex';

// Setup localForage instances for different data types
const habitStore = localforage.createInstance({
  name: 'habithero',
  storeName: 'habits'
});

const completionStore = localforage.createInstance({
  name: 'habithero',
  storeName: 'completions'
});

const activityStore = localforage.createInstance({
  name: 'habithero',
  storeName: 'activity'
});

// Queue of operations to be performed when online
const syncQueue = localforage.createInstance({
  name: 'habithero',
  storeName: 'syncQueue'
});

// Mutex to prevent concurrent sync operations
const syncMutex = new Mutex();

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

interface NetworkStatus {
  online: boolean;
  lastChecked: number;
}

class OfflineService {
  private networkStatus: NetworkStatus = { online: navigator.onLine, lastChecked: Date.now() };
  private syncInProgress = false;
  private listeners: Array<(online: boolean) => void> = [];

  constructor() {
    // Initialize network status listeners
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);
    
    // Check if we need to sync on startup
    this.checkAndSync();
  }

  private handleNetworkChange = async () => {
    const wasOffline = !this.networkStatus.online;
    this.networkStatus = { online: navigator.onLine, lastChecked: Date.now() };
    
    // Notify listeners
    this.listeners.forEach(listener => listener(navigator.onLine));
    
    // If we're back online and were offline before, attempt to sync
    if (wasOffline && navigator.onLine) {
      await this.sync();
    }
  };

  public addNetworkStatusListener(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public isOnline(): boolean {
    return this.networkStatus.online;
  }

  public async refreshNetworkStatus(): Promise<boolean> {
    try {
      // First check browser's online status
      if (!navigator.onLine) {
        this.networkStatus = { online: false, lastChecked: Date.now() };
        this.listeners.forEach(listener => listener(false));
        return false;
      }

      // Try to make a simple request to Supabase
      const { error } = await supabase.from('habits').select('id').limit(1);
      
      const online = !error;
      if (online !== this.networkStatus.online) {
        this.networkStatus = { online, lastChecked: Date.now() };
        this.listeners.forEach(listener => listener(online));
      } else {
        this.networkStatus.lastChecked = Date.now();
      }
      
      return online;
    } catch (error) {
      console.error('Network check failed:', error);
      const online = false;
      if (online !== this.networkStatus.online) {
        this.networkStatus = { online, lastChecked: Date.now() };
        this.listeners.forEach(listener => listener(online));
      } else {
        this.networkStatus.lastChecked = Date.now();
      }
      
      return online;
    }
  }

  /**
   * Check if we're online and sync if needed
   */
  private async checkAndSync(): Promise<void> {
    const online = await this.refreshNetworkStatus();
    if (online) {
      await this.sync();
    }
  }

  /**
   * Get user habits, fetching from the network if online,
   * or from the local store if offline
   */
  public async getUserHabits(userId: string): Promise<any[]> {
    try {
      if (this.networkStatus.online) {
        // Try to fetch from network
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Cache the results
        await this.cacheHabits(data || []);
        
        return data || [];
      } else {
        // Get from local cache
        const cachedHabits = await this.getCachedHabits(userId);
        return cachedHabits;
      }
    } catch (error) {
      console.error('Error getting habits:', error);
      // Fallback to cache if network request fails
      const cachedHabits = await this.getCachedHabits(userId);
      return cachedHabits;
    }
  }
  
  /**
   * Create a habit, sending to the network if online,
   * or queuing for later sync if offline
   */
  public async createHabit(habitData: any): Promise<any> {
    try {
      if (this.networkStatus.online) {
        // Try to send to network
        const { data, error } = await supabase
          .from('habits')
          .insert(habitData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Cache the result
        await habitStore.setItem(data.id, data);
        
        return data;
      } else {
        // Generate a temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempHabit = { ...habitData, id: tempId, created_at: new Date().toISOString() };
        
        // Store locally
        await habitStore.setItem(tempId, tempHabit);
        
        // Queue for later sync
        await this.queueOperation({
          id: tempId,
          type: 'create',
          table: 'habits',
          data: habitData,
          timestamp: Date.now()
        });
        
        return tempHabit;
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      
      // If network request fails, store locally
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempHabit = { ...habitData, id: tempId, created_at: new Date().toISOString() };
      
      await habitStore.setItem(tempId, tempHabit);
      
      await this.queueOperation({
        id: tempId,
        type: 'create',
        table: 'habits',
        data: habitData,
        timestamp: Date.now()
      });
      
      return tempHabit;
    }
  }
  
  /**
   * Complete a habit, sending to the network if online,
   * or queuing for later sync if offline
   */
  public async completeHabit(habitId: string, userId: string): Promise<any> {
    try {
      const completionData = {
        habit_id: habitId,
        user_id: userId,
        completed_at: new Date().toISOString()
      };
      
      if (this.networkStatus.online) {
        // Try to send to network
        const { data, error } = await supabase
          .from('habit_completions')
          .insert(completionData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Cache the result
        await completionStore.setItem(data.id, data);
        
        return data;
      } else {
        // Generate a temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempCompletion = { ...completionData, id: tempId };
        
        // Store locally
        await completionStore.setItem(tempId, tempCompletion);
        
        // Queue for later sync
        await this.queueOperation({
          id: tempId,
          type: 'create',
          table: 'habit_completions',
          data: completionData,
          timestamp: Date.now()
        });
        
        return tempCompletion;
      }
    } catch (error) {
      console.error('Error completing habit:', error);
      
      // If network request fails, store locally
      const completionData = {
        habit_id: habitId,
        user_id: userId,
        completed_at: new Date().toISOString()
      };
      
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempCompletion = { ...completionData, id: tempId };
      
      await completionStore.setItem(tempId, tempCompletion);
      
      await this.queueOperation({
        id: tempId,
        type: 'create',
        table: 'habit_completions',
        data: completionData,
        timestamp: Date.now()
      });
      
      return tempCompletion;
    }
  }
  
  /**
   * Get habit completions, fetching from the network if online,
   * or from the local store if offline
   */
  public async getHabitCompletions(habitId: string): Promise<any[]> {
    try {
      if (this.networkStatus.online) {
        // Try to fetch from network
        const { data, error } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('habit_id', habitId)
          .order('completed_at', { ascending: false });
          
        if (error) throw error;
        
        // Cache the results
        for (const completion of data || []) {
          await completionStore.setItem(completion.id, completion);
        }
        
        return data || [];
      } else {
        // Get from local cache
        const allCompletions: any[] = [];
        await completionStore.iterate((value: any) => {
          if (value.habit_id === habitId) {
            allCompletions.push(value);
          }
        });
        
        // Sort by completed_at descending
        return allCompletions.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );
      }
    } catch (error) {
      console.error('Error getting habit completions:', error);
      
      // Fallback to cache if network request fails
      const allCompletions: any[] = [];
      await completionStore.iterate((value: any) => {
        if (value.habit_id === habitId) {
          allCompletions.push(value);
        }
      });
      
      // Sort by completed_at descending
      return allCompletions.sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );
    }
  }
  
  /**
   * Get family activity, fetching from the network if online,
   * or from the local store if offline
   */
  public async getFamilyActivity(familyId: string): Promise<any[]> {
    try {
      if (this.networkStatus.online) {
        // Try to fetch from network
        const { data, error } = await supabase
          .from('family_activity')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        // Cache the results
        await this.cacheFamilyActivity(data || []);
        
        return data || [];
      } else {
        // Get from local cache
        const cachedActivity = await this.getCachedFamilyActivity(familyId);
        return cachedActivity;
      }
    } catch (error) {
      console.error('Error getting family activity:', error);
      
      // Fallback to cache if network request fails
      const cachedActivity = await this.getCachedFamilyActivity(familyId);
      return cachedActivity;
    }
  }
  
  /**
   * Create family activity, sending to the network if online,
   * or queuing for later sync if offline
   */
  public async createFamilyActivity(activityData: any): Promise<any> {
    try {
      if (this.networkStatus.online) {
        // Try to send to network
        const { data, error } = await supabase
          .from('family_activity')
          .insert(activityData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Cache the result
        await activityStore.setItem(data.id, data);
        
        return data;
      } else {
        // Generate a temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempActivity = { ...activityData, id: tempId, created_at: new Date().toISOString() };
        
        // Store locally
        await activityStore.setItem(tempId, tempActivity);
        
        // Queue for later sync
        await this.queueOperation({
          id: tempId,
          type: 'create',
          table: 'family_activity',
          data: activityData,
          timestamp: Date.now()
        });
        
        return tempActivity;
      }
    } catch (error) {
      console.error('Error creating family activity:', error);
      
      // If network request fails, store locally
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempActivity = { ...activityData, id: tempId, created_at: new Date().toISOString() };
      
      await activityStore.setItem(tempId, tempActivity);
      
      await this.queueOperation({
        id: tempId,
        type: 'create',
        table: 'family_activity',
        data: activityData,
        timestamp: Date.now()
      });
      
      return tempActivity;
    }
  }
  
  /**
   * Cache habits for offline use
   */
  private async cacheHabits(habits: any[]): Promise<void> {
    for (const habit of habits) {
      await habitStore.setItem(habit.id, habit);
    }
  }
  
  /**
   * Get cached habits for a user
   */
  private async getCachedHabits(userId: string): Promise<any[]> {
    const habits: any[] = [];
    await habitStore.iterate((value: any) => {
      if (value.user_id === userId) {
        habits.push(value);
      }
    });
    
    // Sort by created_at descending
    return habits.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  
  /**
   * Cache family activity for offline use
   */
  private async cacheFamilyActivity(activities: any[]): Promise<void> {
    for (const activity of activities) {
      await activityStore.setItem(activity.id, activity);
    }
  }
  
  /**
   * Get cached family activity
   */
  private async getCachedFamilyActivity(familyId: string): Promise<any[]> {
    const activities: any[] = [];
    await activityStore.iterate((value: any) => {
      if (value.family_id === familyId) {
        activities.push(value);
      }
    });
    
    // Sort by created_at descending
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50); // Limit to 50 items
  }
  
  /**
   * Queue an operation for later sync
   */
  private async queueOperation(operation: SyncOperation): Promise<void> {
    await syncQueue.setItem(operation.id, operation);
    console.log(`Operation queued for later sync: ${operation.type} ${operation.table} ${operation.id}`);
  }
  
  /**
   * Synchronize queued operations with the server
   */
  public async sync(): Promise<void> {
    // Use mutex to prevent concurrent sync operations
    return syncMutex.runExclusive(async () => {
      if (this.syncInProgress || !this.networkStatus.online) {
        return;
      }
      
      this.syncInProgress = true;
      
      try {
        console.log('Starting sync operation...');
        
        // Get all queued operations
        const operations: SyncOperation[] = [];
        await syncQueue.iterate((value: SyncOperation) => {
          operations.push(value);
        });
        
        // Sort operations by timestamp (oldest first)
        operations.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`Found ${operations.length} operations to sync`);
        
        // Process operations
        for (const operation of operations) {
          try {
            await this.processSyncOperation(operation);
            // Remove from queue after successful processing
            await syncQueue.removeItem(operation.id);
          } catch (error) {
            console.error(`Error processing operation ${operation.id}:`, error);
            // Keep in queue to retry later
          }
        }
        
        console.log('Sync completed');
      } catch (error) {
        console.error('Error during sync:', error);
      } finally {
        this.syncInProgress = false;
      }
    });
  }
  
  /**
   * Process a single sync operation
   */
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    console.log(`Processing operation: ${operation.type} ${operation.table} ${operation.id}`);
    
    switch (operation.type) {
      case 'create':
        await this.processSyncCreate(operation);
        break;
      case 'update':
        await this.processSyncUpdate(operation);
        break;
      case 'delete':
        await this.processSyncDelete(operation);
        break;
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
    }
  }
  
  /**
   * Process a create operation
   */
  private async processSyncCreate(operation: SyncOperation): Promise<void> {
    const { data, error } = await supabase
      .from(operation.table)
      .insert(operation.data)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update local storage with the server-generated ID
    switch (operation.table) {
      case 'habits':
        // Remove temp entry
        await habitStore.removeItem(operation.id);
        // Add entry with real ID
        await habitStore.setItem(data.id, data);
        break;
      case 'habit_completions':
        await completionStore.removeItem(operation.id);
        await completionStore.setItem(data.id, data);
        break;
      case 'family_activity':
        await activityStore.removeItem(operation.id);
        await activityStore.setItem(data.id, data);
        break;
    }
  }
  
  /**
   * Process an update operation
   */
  private async processSyncUpdate(operation: SyncOperation): Promise<void> {
    const { error } = await supabase
      .from(operation.table)
      .update(operation.data)
      .eq('id', operation.id);
      
    if (error) throw error;
    
    // Update local storage
    switch (operation.table) {
      case 'habits':
        await habitStore.setItem(operation.id, { id: operation.id, ...operation.data });
        break;
      case 'habit_completions':
        await completionStore.setItem(operation.id, { id: operation.id, ...operation.data });
        break;
      case 'family_activity':
        await activityStore.setItem(operation.id, { id: operation.id, ...operation.data });
        break;
    }
  }
  
  /**
   * Process a delete operation
   */
  private async processSyncDelete(operation: SyncOperation): Promise<void> {
    const { error } = await supabase
      .from(operation.table)
      .delete()
      .eq('id', operation.id);
      
    if (error) throw error;
    
    // Remove from local storage
    switch (operation.table) {
      case 'habits':
        await habitStore.removeItem(operation.id);
        break;
      case 'habit_completions':
        await completionStore.removeItem(operation.id);
        break;
      case 'family_activity':
        await activityStore.removeItem(operation.id);
        break;
    }
  }
  
  /**
   * Clear all cached data (useful for logout)
   */
  public async clearCache(): Promise<void> {
    await habitStore.clear();
    await completionStore.clear();
    await activityStore.clear();
    await syncQueue.clear();
  }
}

export const offlineService = new OfflineService();