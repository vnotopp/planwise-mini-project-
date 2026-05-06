import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, initialized } = useAuthStore();

  useEffect(() => {
    // Listen for SIGNED_IN and redirect
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess) {
        navigate('/', { replace: true });
      }
    });

    // If session already exists, redirect immediately
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) navigate('/', { replace: true });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (initialized && session) navigate('/', { replace: true });
  }, [session, initialized, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
