import { useStore, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { BudgetHealthScore } from '@/components/BudgetHealthScore';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, PiggyBank, CreditCard, ArrowUpRight } from 'lucide-react';

const ICONS = [Wallet, ArrowUpRight, PiggyBank, CreditCard, TrendingDown];

export default function Dashboard() {
  const { events, debts, monthlySavings } = useStore();

  const totalActual = events.reduce((sum, e) => sum + e.resources.reduce((s, r) => s + r.actualCost, 0), 0);
  const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
  const remaining = totalBudget - totalActual;
  const totalDebt = debts.reduce((sum, d) => sum + d.principal, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const suggestedRepayment = Math.max(totalMinPayment, monthlySavings);

  const cards = [
    { label: 'Total Event Budget', value: totalBudget },
    { label: 'Total Spent', value: totalActual },
    { label: 'Remaining Budget', value: remaining },
    { label: 'Total Debt', value: totalDebt },
    { label: 'Monthly Repayment', value: suggestedRepayment },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex items-end gap-4">
          <span className="section-number">01</span>
          <div>
            <h1 className="font-display text-4xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Your financial overview at a glance</p>
          </div>
        </div>
        <hr className="gold-rule mt-4" />
      </motion.div>

      {/* Stat Cards — asymmetric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const Icon = ICONS[i];
          return (
            <GlassCard key={card.label} delay={i * 0.05} className="relative overflow-hidden flex flex-col gap-3">
              <Icon className="absolute top-3 right-3 h-14 w-14 text-primary/[0.06]" strokeWidth={1} />
              <div className="relative z-10">
                <span className="label-caps text-muted-foreground">{card.label}</span>
                <AnimatedCounter value={card.value} className="font-mono text-2xl font-bold text-primary block mt-2" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Asymmetric editorial layout: 65% / 35% */}
      <div className="flex items-end gap-4 mt-2">
        <span className="section-number">02</span>
        <h2 className="font-display text-2xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>
          Health & Insights
        </h2>
      </div>
      <hr className="gold-rule" />

      <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
        {/* Main content — left column */}
        <GlassCard delay={0.15}>
          <h2 className="font-display text-lg font-bold text-foreground mb-5">Debt Snapshot</h2>
          {debts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No debts recorded. Add debts in the Debt Manager.</p>
          ) : (
            <div className="space-y-3">
              {debts.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 group hover:border-l-2 hover:border-l-primary hover:pl-3 transition-all">
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

        {/* Sidebar widget — right column */}
        <GlassCard delay={0.2} className="flex flex-col items-center gap-4">
          <BudgetHealthScore />
        </GlassCard>
      </div>
    </div>
  );
}
