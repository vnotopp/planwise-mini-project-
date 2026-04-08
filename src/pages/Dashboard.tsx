import { useStore, formatCurrency } from '@/store/useStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { BudgetHealthScore } from '@/components/BudgetHealthScore';
import { ProgressRing } from '@/components/ProgressRing';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ShoppingBag, Heart, Briefcase, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

const ICONS = [Wallet, ArrowUpRight, PiggyBank, CreditCard, TrendingDown];

export default function Dashboard() {
  const { events, debts, assets, monthlySavings, monthlyIncome } = useStore();
  const { savedServices } = useMarketplaceStore();

  const totalActual = events.reduce((sum, e) => sum + e.resources.reduce((s, r) => s + r.actualCost, 0), 0);
  const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
  const remaining = totalBudget - totalActual;
  const totalDebt = debts.reduce((sum, d) => sum + d.principal, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const suggestedRepayment = Math.max(totalMinPayment, monthlySavings);

  const totalAssets = useMemo(() => assets.reduce((s, a) => s + a.currentValue, 0), [assets]);
  const netWorth = totalAssets - totalDebt;

  // Asset health score (simplified)
  const assetHealthScore = useMemo(() => {
    const categories = new Set(assets.map(a => a.category));
    const liquidAssets = assets.filter(a => ['Bank & Deposits', 'Investment'].includes(a.category)).reduce((s, a) => s + a.currentValue, 0);
    const monthlyExpenses = monthlyIncome - monthlySavings;
    const monthsCovered = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : (liquidAssets > 0 ? 12 : 0);
    const investmentTotal = assets.filter(a => a.category === 'Investment').reduce((s, a) => s + a.currentValue, 0);

    let score = 0;
    score += categories.size >= 5 ? 25 : categories.size >= 3 ? 15 : categories.size >= 2 ? 8 : 0;
    score += monthsCovered > 6 ? 25 : monthsCovered >= 3 ? 15 : monthsCovered >= 1 ? 8 : 0;
    if (totalAssets > 0) {
      const dta = (totalDebt / totalAssets) * 100;
      score += dta < 10 ? 25 : dta <= 20 ? 18 : dta <= 40 ? 10 : 0;
      const ir = (investmentTotal / totalAssets) * 100;
      score += ir > 20 ? 25 : ir >= 10 ? 15 : ir >= 5 ? 8 : 0;
    } else { score += 25; }
    return score;
  }, [assets, totalDebt, monthlyIncome, monthlySavings, totalAssets]);

  const topAssets = useMemo(() => [...assets].sort((a, b) => b.currentValue - a.currentValue).slice(0, 3), [assets]);

  const cards = [
    { label: 'Total Event Budget', value: totalBudget },
    { label: 'Total Spent', value: totalActual },
    { label: 'Remaining Budget', value: remaining },
    { label: 'Total Debt', value: totalDebt },
    { label: 'Monthly Repayment', value: suggestedRepayment },
  ];

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex items-end gap-4">
          <span className="section-number">01</span>
          <div>
            <h1 className="font-display text-foreground" style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-body">Your financial overview at a glance</p>
          </div>
        </div>
        <hr className="gold-rule mt-4" />
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const Icon = ICONS[i];
          return (
            <GlassCard key={card.label} delay={i * 0.05} className="relative overflow-hidden flex flex-col gap-3">
              <Icon className="absolute top-3 right-3 h-14 w-14 text-foreground/[0.08]" strokeWidth={1} />
              <div className="relative z-10">
                <span className="label-caps text-muted-foreground" style={{ letterSpacing: '0.1em' }}>{card.label}</span>
                <AnimatedCounter value={card.value} className="font-mono text-primary block mt-2" style={{ fontSize: '1.8rem', fontWeight: 700 }} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Net Worth + Assets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard delay={0.1} className="relative overflow-hidden">
          <Briefcase className="absolute top-3 right-3 h-14 w-14 text-foreground/[0.08]" strokeWidth={1} />
          <div className="relative z-10">
            <span className="label-caps text-muted-foreground" style={{ letterSpacing: '0.1em' }}>Net Worth</span>
            <AnimatedCounter value={netWorth} className={`font-mono block mt-2 ${netWorth >= 0 ? 'text-primary' : 'text-destructive'}`} style={{ fontSize: '1.8rem', fontWeight: 700 }} />
          </div>
        </GlassCard>
        <GlassCard delay={0.12} className="relative overflow-hidden">
          <TrendingUp className="absolute top-3 right-3 h-14 w-14 text-foreground/[0.08]" strokeWidth={1} />
          <div className="relative z-10">
            <span className="label-caps text-muted-foreground" style={{ letterSpacing: '0.1em' }}>Total Assets</span>
            <AnimatedCounter value={totalAssets} className="font-mono text-success block mt-2" style={{ fontSize: '1.8rem', fontWeight: 700 }} />
          </div>
        </GlassCard>
      </div>

      {/* Section 02 */}
      <div className="space-y-2">
        <div className="flex items-end gap-4">
          <span className="section-number">02</span>
          <h2 className="font-display text-2xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>
            Health & Insights
          </h2>
        </div>
        <hr className="gold-rule" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[45fr_30fr_25fr] gap-6">
        {/* Debt Snapshot */}
        <GlassCard delay={0.15}>
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Debt Snapshot</h2>
          {debts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No debts recorded. Add debts in the Debt Manager.</p>
          ) : (
            <div className="space-y-3">
              {debts.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{d.interestRate}% APR</p>
                  </div>
                  <span className="font-mono font-bold text-primary">{formatCurrency(d.principal)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Budget Health */}
        <GlassCard delay={0.2} className="flex flex-col items-center gap-4">
          <BudgetHealthScore />
        </GlassCard>

        {/* Asset Health */}
        <GlassCard delay={0.25} className="flex flex-col items-center gap-4">
          <h3 className="font-display text-lg font-bold text-foreground">Asset Health</h3>
          <ProgressRing value={assetHealthScore} size={140} strokeWidth={8} label="Score" />
          <span className={`font-display font-bold text-sm ${assetHealthScore >= 75 ? 'text-success' : assetHealthScore >= 50 ? 'text-primary' : assetHealthScore >= 25 ? 'text-warning' : 'text-destructive'}`}>
            {assetHealthScore >= 75 ? 'Excellent' : assetHealthScore >= 50 ? 'Good' : assetHealthScore >= 25 ? 'Needs Attention' : 'Critical'}
          </span>
          {topAssets.length > 0 && (
            <div className="w-full space-y-2 mt-2">
              <span className="label-caps text-muted-foreground text-[10px]">Top Assets</span>
              {topAssets.map(a => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">{a.name}</span>
                  <span className="font-mono text-primary font-bold">{formatCurrency(a.currentValue)}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/portfolio" className="text-xs text-primary hover:underline font-medium mt-1">View Portfolio →</Link>
        </GlassCard>
      </div>

      {/* Marketplace Widget */}
      <GlassCard delay={0.3}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-coral" />
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Marketplace</h3>
              <p className="text-xs text-muted-foreground">
                <Heart className="h-3 w-3 inline mr-1 text-coral" />{savedServices.length} saved services
              </p>
            </div>
          </div>
          <Link to="/marketplace" className="text-xs text-coral font-medium hover:underline">Browse →</Link>
        </div>
      </GlassCard>
    </div>
  );
}
