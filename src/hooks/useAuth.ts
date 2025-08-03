import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role: 'admin' | 'user';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(loading);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Keep ref in sync with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const clearTimeoutIfExists = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const setLoadingWithTimeout = (isLoading: boolean) => {
    console.log('Setting loading to:', isLoading);
    setLoading(isLoading);
    
    if (isLoading) {
      // Clear any existing timeout
      clearTimeoutIfExists();
      
      // Set new timeout - reduced to 5 seconds for faster recovery
      timeoutRef.current = setTimeout(() => {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }, 5000);
    } else {
      // Clear timeout when loading is set to false
      clearTimeoutIfExists();
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No role found, create default user role
          console.log('No user role found, creating default user role');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'user',
            });
          
          if (insertError) {
            console.error('Error creating default user role:', insertError);
          }
          setUserRole('user');
        } else {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      } else {
        console.log('User role found:', data?.role);
        setUserRole(data?.role ?? 'user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    } finally {
      console.log('Setting loading to false after role fetch');
      setLoadingWithTimeout(false);
    }
  };

  useEffect(() => {
    console.log('useAuth: Starting authentication initialization...');
    
    // Set a very short timeout to prevent getting stuck
    const quickTimeout = setTimeout(() => {
      console.warn('Quick timeout - forcing loading to false');
      setLoading(false);
    }, 3000);

    // Test connection immediately
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('user_roles').select('count').limit(1);
        if (error) {
          console.error('Supabase connection test failed:', error);
          return false;
        }
        console.log('Supabase connection test successful');
        return true;
      } catch (error) {
        console.error('Supabase connection test exception:', error);
        return false;
      }
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        
        // Test connection first
        const connectionOk = await testConnection();
        if (!connectionOk) {
          console.error('Supabase connection failed, setting loading to false');
          clearTimeout(quickTimeout);
          setLoadingWithTimeout(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          clearTimeout(quickTimeout);
          setLoadingWithTimeout(false);
          return;
        }

        console.log('Session found:', !!session, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          clearTimeout(quickTimeout);
          setLoadingWithTimeout(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        clearTimeout(quickTimeout);
        setLoadingWithTimeout(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          setLoadingWithTimeout(false);
        }
      }
    );

    // Store subscription reference for cleanup
    subscriptionRef.current = subscription;

    return () => {
      console.log('useAuth: Cleaning up authentication...');
      clearTimeout(quickTimeout);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      clearTimeoutIfExists();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const signIn = async (email: string, password: string) => {
    setLoadingWithTimeout(true);
    try {
      console.log('Signing in user:', email);
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      // If sign-in is successful, the onAuthStateChange listener will handle the rest
      if (result.error) {
        console.error('Sign in error:', result.error);
        setLoadingWithTimeout(false);
      }
      
      return result;
    } catch (error) {
      console.error('Sign in exception:', error);
      setLoadingWithTimeout(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoadingWithTimeout(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (data.user && !error) {
        // Create profile
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          full_name: fullName,
        });

        // Assign default user role
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'user',
        });
      }

      setLoadingWithTimeout(false);
      return { data, error };
    } catch (error) {
      setLoadingWithTimeout(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoadingWithTimeout(true);
    try {
      const result = await supabase.auth.signOut();
      setLoadingWithTimeout(false);
      return result;
    } catch (error) {
      setLoadingWithTimeout(false);
      throw error;
    }
  };

  return {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
  };
};