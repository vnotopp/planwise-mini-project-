import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { LiveClock } from '@/components/LiveClock';
import { NotificationBell } from '@/components/NotificationBell';
import { OnboardingModal, getUserSetup } from '@/components/OnboardingModal';
import { useAuthStore, initAuth } from '@/store/useAuthStore';

let bootstrapped = false;

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session, profile, initialized } = useAuthStore();
  const [editProfile, setEditProfile] = useState(false);
  const [userKey, setUserKey] = useState(0);

  useEffect(() => {
    if (!bootstrapped) {
      bootstrapped = true;
      initAuth();
    }
  }, []);

  const handleComplete = useCallback(() => {
    setEditProfile(false);
    setUserKey((k) => k + 1);
  }, []);

  // Bare layout on /auth routes — no sidebar, no chrome
  if (location.pathname === '/auth' || location.pathname === '/auth/callback') {
    return <>{children}</>;
  }

  // Show onboarding role picker only after sign-in if profile exists with no role yet,
  // OR for legacy unauthenticated demo flow if no localStorage setup exists.
  const needsLegacySetup = !session && initialized && !getUserSetup();
  const needsRoleSelection = !!session && !!profile && !profile.role;
  const showOnboarding = editProfile || needsLegacySetup || needsRoleSelection;
  const editValues = editProfile ? getUserSetup() : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar key={userKey} onEditProfile={() => setEditProfile(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0 bg-background/50 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <LiveClock />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <OnboardingModal open={showOnboarding} onComplete={handleComplete} initialValues={editValues} />
    </SidebarProvider>
  );
}
