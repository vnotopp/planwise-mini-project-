import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore, initAuth } from '@/store/useAuthStore';

let bootstrapped = false;

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, initialized } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!bootstrapped) {
      bootstrapped = true;
      initAuth();
    }
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
