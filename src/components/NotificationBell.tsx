import { useState, useEffect, useMemo } from 'react';
import { useStore, formatCurrency, generateId } from '@/store/useStore';
import { Bell, X, AlertTriangle, CheckCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP = {
  critical: AlertCircle,
  warning: AlertTriangle,
  milestone: CheckCircle,
  tip: Lightbulb,
};

const COLOR_MAP = {
  critical: 'border-destructive text-destructive',
  warning: 'border-warning text-warning',
  milestone: 'border-success text-success',
  tip: 'border-[hsl(210_80%_60%)] text-[hsl(210_80%_60%)]',
};

const BG_MAP = {
  critical: 'bg-destructive/5',
  warning: 'bg-warning/5',
  milestone: 'bg-success/5',
  tip: 'bg-[hsl(210_80%_60%/0.05)]',
};

export function NotificationBell() {
  const { assets, debts, events, monthlyIncome, monthlySavings, notifications, addNotification, markAllNotificationsRead } = useStore();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Generate notifications on data changes
  useEffect(() => {
    const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
    const totalLiabilities = debts.reduce((s, d) => s + d.principal, 0);
    const netWorth = totalAssets - totalLiabilities;
    const liquidAssets = assets.filter(a => ['Bank & Deposits', 'Investment'].includes(a.category)).reduce((s, a) => s + a.currentValue, 0);
    const monthlyExpenses = monthlyIncome - monthlySavings;
    const categories = new Set(assets.map(a => a.category));
    const investmentTotal = assets.filter(a => a.category === 'Investment').reduce((s, a) => s + a.currentValue, 0);
    const investmentRatio = totalAssets > 0 ? (investmentTotal / totalAssets) * 100 : 0;
    const dtaRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const monthsCovered = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 99;
    const existingTitles = new Set(notifications.map(n => n.title));

    const newNotifs: Array<{ type: 'critical' | 'warning' | 'milestone' | 'tip'; title: string; description: string }> = [];

    // Critical checks
    if (monthsCovered < 1 && monthlyExpenses > 0 && !existingTitles.has('Low Liquidity Alert')) {
      newNotifs.push({ type: 'critical', title: 'Low Liquidity Alert', description: `Liquid assets cover less than 1 month of expenses (${formatCurrency(liquidAssets)})` });
    }
    debts.filter(d => d.interestRate > 36).forEach(d => {
      const title = `High Interest: ${d.name}`;
      if (!existingTitles.has(title)) newNotifs.push({ type: 'critical', title, description: `${d.name} has ${d.interestRate}% APR — prioritize paying this off` });
    });

    // Warning checks
    if (dtaRatio > 30 && !existingTitles.has('High Debt-to-Asset Ratio')) {
      newNotifs.push({ type: 'warning', title: 'High Debt-to-Asset Ratio', description: `DTI is ${dtaRatio.toFixed(1)}% — aim for below 20%` });
    }
    if (categories.size <= 2 && assets.length > 0 && !existingTitles.has('Low Diversification')) {
      newNotifs.push({ type: 'warning', title: 'Low Diversification', description: `Only ${categories.size} asset categories — consider diversifying` });
    }
    if (investmentRatio < 5 && totalAssets > 0 && !existingTitles.has('Low Investment Ratio')) {
      newNotifs.push({ type: 'warning', title: 'Low Investment Ratio', description: `Only ${investmentRatio.toFixed(1)}% in investments — consider increasing` });
    }

    // Milestones
    const milestones = [1000000, 2500000, 5000000, 10000000];
    milestones.forEach(m => {
      const title = `Net Worth crossed ${formatCurrency(m)}`;
      if (netWorth >= m && !existingTitles.has(title)) {
        newNotifs.push({ type: 'milestone', title, description: `Congratulations! Your net worth is now ${formatCurrency(netWorth)}` });
      }
    });

    // Tips
    if (monthlySavings > 0 && monthlyIncome > 0 && (monthlySavings / monthlyIncome) > 0.2 && investmentRatio < 15 && !existingTitles.has('Consider Increasing SIP')) {
      newNotifs.push({ type: 'tip', title: 'Consider Increasing SIP', description: `Your savings rate is good — consider routing more into SIP investments` });
    }

    newNotifs.forEach(n => {
      addNotification({ id: generateId(), ...n, timestamp: new Date().toISOString(), read: false });
    });
  }, [assets.length, debts.length, monthlyIncome, monthlySavings]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4.5 w-4.5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-mono font-bold flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-[380px]">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle className="font-display font-bold">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllNotificationsRead} className="text-xs text-muted-foreground">
              Mark all read
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No notifications yet</p>
          ) : (
            notifications.map(n => {
              const Icon = ICON_MAP[n.type];
              const colors = COLOR_MAP[n.type];
              const bg = BG_MAP[n.type];
              return (
                <div key={n.id} className={`rounded-lg border-l-3 p-3 ${colors.split(' ')[0]} ${!n.read ? bg : ''}`}>
                  <div className="flex gap-2">
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${colors.split(' ')[1]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                        {new Date(n.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
