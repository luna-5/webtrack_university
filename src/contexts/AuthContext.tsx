import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  hasTeam: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshTeamStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasTeam, setHasTeam] = useState(false);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    setUserRole(data?.role || null);
  };

  const checkTeamStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('default_team_id')
      .eq('id', userId)
      .maybeSingle();
    setHasTeam(!!data?.default_team_id);
  };

  const refreshTeamStatus = async () => {
    if (user) {
      await checkTeamStatus(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        checkTeamStatus(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (() => {
        (async () => {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            fetchUserRole(session.user.id);
            checkTeamStatus(session.user.id);
          } else {
            setUserRole(null);
            setHasTeam(false);
          }

          setLoading(false);

          if (event === 'SIGNED_IN' && session?.user) {
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email!,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' });

            if (error) {
              console.error('Error upserting profile:', error);
            }
          }
        })();
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user && !error) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setUserRole(null);
    setHasTeam(false);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    hasTeam,
    signUp,
    signIn,
    signOut,
    refreshTeamStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
