
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Define type for user profile updates
interface ProfileUpdate {
  displayName?: string;
  avatarColor?: string;
}

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  updateProfile: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sessionData) => {
        setSession(sessionData);
        setCurrentUser(sessionData?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
      setSession(sessionData);
      setCurrentUser(sessionData?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      // Create new user
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      
      if (signUpError) {
        return { error: signUpError };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };
  
  // New method for updateProfile
  const updateProfile = async (updates: ProfileUpdate) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: updates.displayName,
          avatar_color: updates.avatarColor
        }
      });
      
      if (updateError) {
        toast.error(`Failed to update profile: ${updateError.message}`);
        throw updateError;
      }
      
      // Also update the profile in the profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          avatar_color: updates.avatarColor,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);
      
      if (profileUpdateError) {
        toast.error(`Failed to update profile data: ${profileUpdateError.message}`);
        throw profileUpdateError;
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw error;
    }
  };
  
  // Alias for signOut for compatibility
  const logout = async () => {
    const { error } = await signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
