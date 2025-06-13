import { supabase } from '../lib/supabase';

/**
 * Ensures that a user profile exists in the database for the authenticated user.
 * If no profile exists, it creates one using the auth user data.
 * This is necessary because auth.user and database users are separate in Supabase.
 * 
 * @returns A promise that resolves when the operation is complete
 */
export const ensureUserProfile = async (): Promise<void> => {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session?.user) {
      console.error('No active user session found');
      return;
    }
    
    const authUser = sessionData.session.user;
    
    // Check if user profile exists in users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();
    
    // If user doesn't exist or there was an error (like PGRST116 "no rows returned")
    if (fetchError || !existingUser) {
      // Create user profile using auth data
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New User',
          avatar_url: authUser.user_metadata?.avatar_url || null
        }]);
      
      if (insertError) {
        console.error('Failed to create user profile:', insertError);
        throw new Error('User profile creation failed. Please try again.');
      }
      
      console.log('User profile created successfully');
    } else {
      console.log('User profile already exists');
    }
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    throw error;
  }
};

/**
 * Updates the family ID for the current user
 * 
 * @param familyId The ID of the family to join
 * @returns A promise that resolves when the operation is complete
 */
export const updateUserFamilyId = async (familyId: string | null): Promise<void> => {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session?.user) {
      throw new Error('No active user session found');
    }
    
    // Ensure user profile exists first
    await ensureUserProfile();
    
    // Update user's family ID
    const { error: updateError } = await supabase
      .from('users')
      .update({ family_id: familyId })
      .eq('id', sessionData.session.user.id);
    
    if (updateError) {
      console.error('Failed to update user family ID:', updateError);
      throw updateError;
    }
    
    console.log('User family ID updated successfully');
  } catch (error) {
    console.error('Error in updateUserFamilyId:', error);
    throw error;
  }
};