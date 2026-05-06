import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, initialized } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_IN' && sess && mounted) {
        navigate('/dashboard', { replace: true });
      }
    });

    const completeOAuthSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = params.get('code');
      const errorDescription = params.get('error_description') || hashParams.get('error_description');

      if (errorDescription) {
        toast.error('Google sign-in failed', { description: errorDescription });
        navigate('/auth', { replace: true });
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error('Could not complete sign-in', { description: error.message });
          navigate('/auth', { replace: true });
        }
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && mounted) {
        navigate('/dashboard', { replace: true });
      } else if (mounted) {
        navigate('/auth', { replace: true });
      }
    };

    completeOAuthSignIn();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (initialized && session) navigate('/dashboard', { replace: true });
  }, [session, initialized, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
