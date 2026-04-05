import { ReactNode, useState, useCallback } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { LiveClock } from '@/components/LiveClock';
import { OnboardingModal, getUserSetup, UserSetup } from '@/components/OnboardingModal';

export function AppLayout({ children }: { children: ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(!getUserSetup());
  const [editProfile, setEditProfile] = useState(false);
  const [userKey, setUserKey] = useState(0);

  const handleComplete = useCallback(() => {
    setShowOnboarding(false);
    setEditProfile(false);
    setUserKey((k) => k + 1);
  }, []);

  const editValues = editProfile ? getUserSetup() : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar key={userKey} onEditProfile={() => setEditProfile(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0 bg-background/50 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <LiveClock />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <OnboardingModal open={showOnboarding || editProfile} onComplete={handleComplete} initialValues={editValues} />
    </SidebarProvider>
  );
}
