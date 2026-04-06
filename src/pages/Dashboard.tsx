import { useStore, formatCurrency } from '@/store/useStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { BudgetHealthScore } from '@/components/BudgetHealthScore';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ShoppingBag, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const ICONS = [Wallet, ArrowUpRight, PiggyBank, CreditCard, TrendingDown];

export default function Dashboard() {
  const { events, debts, monthlySavings } = useStore();
  const { savedServices } = useMarketplaceStore();

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

      <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
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
      </div>

      {/* Marketplace Widget */}
      <GlassCard delay={0.25}>
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
