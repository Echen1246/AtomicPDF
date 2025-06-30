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
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true); // Set loading while fetching profile
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Handle token refresh without setting loading
          await fetchProfile(session.user.id);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          // Profile doesn't exist, create one
          await createProfile(userId);
        } else {
          throw error;
        }
      } else {
        console.log('Profile loaded successfully:', data);
        setProfile(data);
        // Force refresh if subscription data seems outdated
        if (data && !data.subscription_tier) {
          console.warn('Profile missing subscription data, setting defaults');
          setProfile({
            ...data,
            subscription_tier: data.subscription_tier || 'free',
            subscription_status: data.subscription_status || 'active',
            pdf_count_used: data.pdf_count_used || 0
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.message !== 'Profile fetch timeout') {
        toast.error('Error loading profile. Please refresh the page.');
      }
      // Set a default profile to prevent infinite loading
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setProfile({
          id: userId,
          email: userData.user.email!,
          full_name: userData.user.user_metadata.full_name || userData.user.email!.split('@')[0],
          avatar_url: userData.user.user_metadata.avatar_url,
          subscription_tier: 'free',
          subscription_status: 'active',
          pdf_count_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Profile);
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
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
    setLoading(true);
    await fetchProfile(user.id);
  };

  // Add a method to manually reset stuck loading state
  const resetLoadingState = () => {
    console.log('Manually resetting loading state');
    setLoading(false);
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