import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, SUBSCRIPTION_LIMITS } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  canEditPDF: () => boolean;
  incrementPDFCount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isCancelled) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile but don't block on it
          fetchProfile(session.user.id).finally(() => {
            if (!isCancelled) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (!isCancelled) setLoading(false);
      }
    };

    initAuth();

    // Simple auth state listener - only handle actual changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isCancelled) return;
      
      console.log('Auth event:', event);
      
      // Only handle meaningful events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    // Always clear loading after 3 seconds as failsafe
    const timeout = setTimeout(() => {
      if (!isCancelled) setLoading(false);
    }, 3000);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createProfile(userId);
        } else {
          console.error('Profile fetch error:', error);
          // Don't throw, just use defaults
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Profile error:', error);
      // Don't show error toast - just fail silently
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      if (!user) return;

      const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: userId,
        email: user.email!,
        full_name: user.user_metadata.full_name || user.email!.split('@')[0],
        avatar_url: user.user_metadata.avatar_url,
        subscription_tier: 'free',
        subscription_status: 'active',
        pdf_count_used: 0,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      toast.success('Welcome to AtomicPDF!');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Error creating profile');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.REACT_APP_APP_URL || window.location.origin}/editor`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const canEditPDF = (): boolean => {
    if (!profile) return false;
    
    const limits = SUBSCRIPTION_LIMITS[profile.subscription_tier];
    if (limits.pdfs_per_month === -1) return true; // unlimited
    
    return profile.pdf_count_used < limits.pdfs_per_month;
  };

  const incrementPDFCount = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          pdf_count_used: profile.pdf_count_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, pdf_count_used: prev.pdf_count_used + 1 } : null);
    } catch (error) {
      console.error('Error incrementing PDF count:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signOut,
    canEditPDF,
    incrementPDFCount,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 