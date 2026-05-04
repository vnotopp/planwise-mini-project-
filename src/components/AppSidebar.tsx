import { LayoutDashboard, CalendarDays, Receipt, Landmark, BarChart3, Compass, Settings, ShoppingBag, UserPen, Briefcase, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserSetup } from '@/components/OnboardingModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Event Planner', url: '/events', icon: CalendarDays },
  { title: 'Expense Tracker', url: '/expenses', icon: Receipt },
  { title: 'Debt Manager', url: '/debts', icon: Landmark },
  { title: 'Portfolio', url: '/portfolio', icon: Briefcase },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Marketplace', url: '/marketplace', icon: ShoppingBag },
];

const roleLabels: Record<string, string> = {
  'event-planner': 'Event Planner',
  'budget-manager': 'Budget Manager',
  'financial-analyst': 'Financial Analyst',
  'all': 'All Roles',
};

export function AppSidebar({ onEditProfile }: { onEditProfile?: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { events, debts, monthlyIncome, monthlySavings } = useStore();
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const localUser = getUserSetup();
  const userName = profile?.full_name ?? localUser?.name ?? 'User';
  const userRole = profile?.role
    ? (roleLabels[profile.role] ?? profile.role)
    : localUser?.role
      ? (roleLabels[localUser.role] ?? localUser.role)
      : 'Getting Started';
  const userInitial = userName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url ?? null;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/auth', { replace: true });
  };

  const totalBudget = events.reduce((s, e) => s + e.budget, 0);
  const totalActual = events.reduce((s, e) => s + e.resources.reduce((a, r) => a + r.actualCost, 0), 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);

  let quickScore = 0;
  if (totalBudget > 0) {
    const r = totalActual / totalBudget;
    quickScore += r < 0.7 ? 30 : r <= 0.9 ? 20 : r <= 1 ? 10 : 0;
  } else if (totalActual === 0) quickScore += 30;
  if (monthlyIncome > 0) {
    const r = totalMinPayment / monthlyIncome;
    quickScore += r < 0.2 ? 25 : r <= 0.35 ? 15 : r <= 0.5 ? 8 : 0;
  } else if (totalMinPayment === 0) quickScore += 25;
  if (monthlyIncome > 0) {
    const r = monthlySavings / monthlyIncome;
    quickScore += r > 0.3 ? 25 : r >= 0.2 ? 18 : r >= 0.1 ? 10 : 0;
  }
  quickScore += 20;

  const dotColor = quickScore >= 75 ? 'bg-success' : quickScore >= 50 ? 'bg-primary' : quickScore >= 25 ? 'bg-warning' : 'bg-destructive';

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg btn-primary-gradient shrink-0">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-extrabold text-primary tracking-tight" style={{ letterSpacing: '-0.03em' }}>PlanWise</h1>
              <p className="font-mono text-[9px] text-muted-foreground tracking-[0.15em] uppercase">Financial Suite</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-5 flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-primary font-display font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate uppercase tracking-wide">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{userRole}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mt-3 flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-primary font-display font-bold text-xs">
              {userInitial}
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="label-caps text-muted-foreground text-[10px] tracking-[0.12em]">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-all hover:text-foreground"
                      activeClassName="text-primary bg-[hsl(43_88%_55%/0.12)]"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span className="text-[14px] font-medium" style={{ letterSpacing: '0.01em' }}>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
            <span className="text-xs text-muted-foreground">Health</span>
            <span className="ml-auto font-mono text-xs text-primary font-bold">{quickScore}</span>
          </div>
        )}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3 px-3'}`}>
          <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0" />
          {!collapsed && onEditProfile && (
            <button onClick={onEditProfile} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <UserPen className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
          <div className={collapsed ? '' : 'ml-auto'}>
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
