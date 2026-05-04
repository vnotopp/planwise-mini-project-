import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
    if (session?.user) {
      // Defer profile fetch to avoid deadlocks inside auth callback
      setTimeout(() => get().fetchProfile(session.user.id), 0);
    } else {
      set({ profile: null });
    }
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) set({ profile: data as Profile });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },
}));

// Bootstrap: set up listener BEFORE getSession (per Supabase best practice)
export function initAuth() {
  const { setSession } = useAuthStore.getState();

  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    useAuthStore.setState({ loading: false, initialized: true });
  });
}
