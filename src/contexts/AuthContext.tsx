import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ensureUserProfile } from '../utils/userProfileUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom error handler for auth errors
const handleAuthError = (error: AuthError) => {
  console.error('Auth error:', error);
  
  switch (error.message) {
    case 'Invalid login credentials':
      throw new Error('Invalid email or password. Please try again.');
    case 'Email not confirmed':
      throw new Error('Please verify your email address before logging in.');
    case 'Password should be at least 6 characters':
      throw new Error('Password must be at least 6 characters long.');
    case 'User already registered':
      throw new Error('An account with this email already exists.');
    default:
      throw new Error('An unexpected error occurred. Please try again.');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Checking active session...');
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session check result:', session ? 'Session found' : 'No session');
      setUser(session?.user ?? null);
      
      // Ensure user profile exists in database
      if (session?.user) {
        ensureUserProfile().catch(error => {
          console.error('Error ensuring user profile:', error);
        });
      }
      
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'PASSWORD_RECOVERY') {
        toast.success('Password reset email sent!');
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Ensure user has a profile when they sign in
        ensureUserProfile().catch(error => {
          console.error('Error ensuring user profile on sign in:', error);
        });
      }
      
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting sign in...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        handleAuthError(error);
      }
      
      // After successful sign in, ensure user profile exists
      if (data.user) {
        try {
          await ensureUserProfile();
        } catch (profileError) {
          console.error('Failed to ensure user profile after sign in:', profileError);
          // Don't block the sign-in process due to profile issues
        }
      }
      
      console.log('AuthContext: Sign in successful');
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('AuthContext: Attempting sign up...');
    try {
      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        handleAuthError(error);
      }
      
      // Create user profile in the database if sign up was successful
      if (data.user) {
        try {
          await supabase.from('users').insert([{
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
          }]);
          console.log('User profile created successfully');
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Don't throw here, as the auth signup was successful
        }
      }
      
      console.log('AuthContext: Sign up successful');
      toast.success('Account created! Please check your email for verification.');
    } catch (error) {
      console.error('AuthContext: Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Attempting sign out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleAuthError(error);
      }
      console.log('AuthContext: Sign out successful');
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        handleAuthError(error);
      }
      toast.success('Password reset instructions sent to your email.');
    } catch (error) {
      console.error('AuthContext: Password reset error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 