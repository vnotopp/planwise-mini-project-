import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { session, initialized } = useAuthStore();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialized && session) navigate('/', { replace: true });
  }, [session, initialized, navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error('Google sign-in failed', { description: String((result.error as Error).message ?? result.error) });
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate('/', { replace: true });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success('Account created — welcome!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (err) {
      toast.error(mode === 'signup' ? 'Sign up failed' : 'Sign in failed', {
        description: err instanceof Error ? err.message : 'Try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl btn-primary-gradient mb-4">
            <Compass className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            PlanWise
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Your complete financial suite</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-[52px] rounded-lg bg-white text-gray-900 font-semibold flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="w-full h-[52px] rounded-lg border border-border text-foreground font-medium flex items-center justify-center gap-3 hover:bg-muted/30 transition-all"
            >
              <Mail className="h-5 w-5" />
              <span>Continue with Email</span>
            </button>
          ) : (
            <form onSubmit={handleEmail} className="space-y-3 rounded-lg border border-border p-4 bg-card">
              {mode === 'signup' && (
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-muted/30"
                />
              )}
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/30"
              />
              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-muted/30"
              />
              <Button type="submit" disabled={loading} className="w-full btn-primary-gradient font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'signup' ? 'Create account' : 'Sign in')}
              </Button>
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
