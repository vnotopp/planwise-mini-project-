import { useStore, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ProgressRing } from '@/components/ProgressRing';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, PiggyBank, CreditCard, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { events, debts, monthlyIncome, monthlySavings } = useStore();

  const totalEstimated = events.reduce((sum, e) => sum + e.resources.reduce((s, r) => s + r.estimatedCost, 0), 0);
  const totalActual = events.reduce((sum, e) => sum + e.resources.reduce((s, r) => s + r.actualCost, 0), 0);
  const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
  const remaining = totalBudget - totalActual;
  const totalDebt = debts.reduce((sum, d) => sum + d.principal, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const suggestedRepayment = Math.max(totalMinPayment, monthlySavings);

  // Budget health: 100 = perfect (no overspend), drops as overspend increases
  const healthScore = totalBudget > 0
    ? Math.max(0, Math.min(100, Math.round(((totalBudget - totalActual) / totalBudget) * 100)))
    : totalActual === 0 ? 100 : 0;

  const cards = [
    { label: 'Total Event Budget', value: totalBudget, icon: Wallet, delay: 0 },
    { label: 'Total Spent', value: totalActual, icon: ArrowUpRight, delay: 0.1 },
    { label: 'Remaining Budget', value: remaining, icon: PiggyBank, delay: 0.2 },
    { label: 'Total Debt', value: totalDebt, icon: CreditCard, delay: 0.3 },
    { label: 'Monthly Repayment', value: suggestedRepayment, icon: TrendingDown, delay: 0.4 },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your financial overview at a glance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <GlassCard key={card.label} delay={card.delay} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <AnimatedCounter value={card.value} className="font-display text-2xl font-bold text-foreground" />
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard delay={0.5} className="flex flex-col items-center gap-4 lg:col-span-1">
          <h2 className="font-display text-lg font-semibold text-foreground">Budget Health</h2>
          <ProgressRing value={healthScore} size={160} strokeWidth={10} label="Score" />
          <p className="text-sm text-muted-foreground text-center">
            {healthScore >= 70 ? 'Your finances are in great shape!' : healthScore >= 40 ? 'Watch your spending closely.' : 'You\'re over budget. Time to cut back.'}
          </p>
        </GlassCard>

        <GlassCard delay={0.6} className="lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Debt Snapshot</h2>
          {debts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No debts recorded. Add debts in the Debt Manager.</p>
          ) : (
            <div className="space-y-3">
              {debts.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.interestRate}% APR</p>
                  </div>
                  <span className="font-display font-semibold text-foreground">{formatCurrency(d.principal)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
