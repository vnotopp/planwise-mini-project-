import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore, initAuth } from '@/store/useAuthStore';
import { useStore } from '@/store/useStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';

let bootstrapped = false;

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, initialized, user } = useAuthStore();
  const location = useLocation();
  const loadAll = useStore((s) => s.loadAll);
  const resetState = useStore((s) => s.resetState);
  const loaded = useStore((s) => s.loaded);
  const loadMarketplace = useMarketplaceStore((s) => s.loadAll);

  useEffect(() => {
    if (!bootstrapped) {
      bootstrapped = true;
      initAuth();
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAll(user.id);
      loadMarketplace(user.id);
    } else {
      resetState();
    }
  }, [user, loadAll, resetState, loadMarketplace]);

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

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
