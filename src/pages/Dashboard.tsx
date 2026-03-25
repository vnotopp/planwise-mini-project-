import { useStore, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { BudgetHealthScore } from '@/components/BudgetHealthScore';
import { LiquidChromeBackground } from '@/components/LiquidChromeBackground';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, PiggyBank, CreditCard, ArrowUpRight } from 'lucide-react';

const ICONS = [Wallet, ArrowUpRight, PiggyBank, CreditCard, TrendingDown];
const BG_ICONS = [Wallet, ArrowUpRight, PiggyBank, CreditCard, TrendingDown];

export default function Dashboard() {
  const { events, debts, monthlySavings } = useStore();

  const totalActual = events.reduce((sum, e) => sum + e.resources.reduce((s, r) => s + r.actualCost, 0), 0);
  const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
  const remaining = totalBudget - totalActual;
  const totalDebt = debts.reduce((sum, d) => sum + d.principal, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const suggestedRepayment = Math.max(totalMinPayment, monthlySavings);

  const cards = [
    { label: 'Total Event Budget', value: totalBudget, delay: 0 },
    { label: 'Total Spent', value: totalActual, delay: 0.1 },
    { label: 'Remaining Budget', value: remaining, delay: 0.2 },
    { label: 'Total Debt', value: totalDebt, delay: 0.3 },
    { label: 'Monthly Repayment', value: suggestedRepayment, delay: 0.4 },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your financial overview at a glance</p>
      </motion.div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const Icon = ICONS[i];
          return (
            <GlassCard key={card.label} delay={card.delay} className="relative overflow-hidden flex flex-col gap-3 noise-overlay">
              <Icon className="absolute top-3 right-3 h-16 w-16 text-primary/[0.06]" strokeWidth={1} />
              <div className="relative z-10">
                <span className="label-caps text-muted-foreground">{card.label}</span>
                <AnimatedCounter value={card.value} className="font-mono text-2xl font-bold text-primary block mt-2" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard delay={0.5} className="flex flex-col items-center gap-4 lg:col-span-1 noise-overlay relative overflow-hidden">
          <LiquidChromeBackground size={500} opacity={0.35} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-0" />
          <BudgetHealthScore />
        </GlassCard>
<GlassCard delay={0.6} className="lg:col-span-2 noise-overlay">
  <h2 className="font-display text-lg font-bold text-foreground mb-4">Debt Snapshot</h2>
  {debts.length === 0 ? (
    <p className="text-muted-foreground text-sm">No debts recorded. Add debts in the Debt Manager.</p>
  ) : (
    <div className="space-y-3">
      {debts.slice(0, 5).map((d) => (
        <div key={d.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 group hover:border-l-2 hover:border-l-primary transition-all">
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
      </div>
    </div>
  );
}
