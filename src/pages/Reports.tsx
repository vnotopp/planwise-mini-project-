import { useStore, formatCurrency, type ResourceCategory } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#F0B429', '#D97706', '#10B981', '#EF4444', '#06B6D4', '#EC4899'];
const CATEGORIES: ResourceCategory[] = ['Food', 'Venue', 'Decor', 'Transport', 'Misc'];

const tooltipStyle = { background: 'hsl(220 30% 5%)', border: '1px solid hsl(215 14% 15%)', borderRadius: '8px', color: '#F0F6FC' };

export default function Reports() {
  const { events, debts, monthlySavings } = useStore();

  const categoryData = useMemo(() => {
    const map: Record<string, { estimated: number; actual: number }> = {};
    CATEGORIES.forEach((c) => (map[c] = { estimated: 0, actual: 0 }));
    events.forEach((ev) =>
      ev.resources.forEach((r) => {
        if (map[r.category]) {
          map[r.category].estimated += r.estimatedCost;
          map[r.category].actual += r.actualCost;
        }
      })
    );
    return CATEGORIES.map((c) => ({ category: c, estimated: map[c].estimated, actual: map[c].actual }));
  }, [events]);

  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((ev) => ev.resources.forEach((r) => { map[r.category] = (map[r.category] || 0) + r.estimatedCost; }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const timeline = useMemo(() => {
    if (debts.length === 0 || monthlySavings <= 0) return [];
    let remaining = debts.map((d) => ({ ...d, balance: d.principal }));
    const data: { month: number; totalDebt: number }[] = [];
    let month = 0;
    while (remaining.some((d) => d.balance > 0) && month < 600) {
      month++;
      remaining = remaining.map((d) => ({ ...d, balance: d.balance > 0 ? d.balance * (1 + d.interestRate / 100 / 12) : 0 }));
      let extra = monthlySavings;
      remaining = remaining.map((d) => {
        if (d.balance <= 0) return d;
        const p = Math.min(d.minimumPayment, d.balance);
        extra -= p;
        return { ...d, balance: Math.max(0, d.balance - p) };
      });
      const sorted = [...remaining].filter((d) => d.balance > 0).sort((a, b) => b.interestRate - a.interestRate);
      for (const debt of sorted) {
        if (extra <= 0) break;
        const idx = remaining.findIndex((d) => d.id === debt.id);
        const p = Math.min(extra, remaining[idx].balance);
        remaining[idx].balance = Math.max(0, remaining[idx].balance - p);
        extra -= p;
      }
      data.push({ month, totalDebt: Math.round(remaining.reduce((s, d) => s + d.balance, 0)) });
      if (data[data.length - 1].totalDebt <= 0) break;
    }
    return data;
  }, [debts, monthlySavings]);

  const hasData = events.some((e) => e.resources.length > 0) || debts.length > 0;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex items-end gap-4">
          <span className="section-number text-emerald/20">01</span>
          <div>
            <h1 className="font-display text-4xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>Reports</h1>
            <p className="text-muted-foreground mt-1 text-sm">Visual analysis of your budgets and debt</p>
          </div>
        </div>
        <hr className="gold-rule" />
      </motion.div>

      {!hasData ? (
        <EmptyState icon={BarChart3} title="No data to report" description="Add events or debts to see visual reports here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h2 className="font-display text-lg font-bold mb-4">Planned vs Actual by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 15%)" />
                <XAxis dataKey="category" stroke="#8B949E" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8B949E" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="estimated" fill="#F0B429" radius={[4, 4, 0, 0]} animationDuration={1000} name="Estimated" />
                <Bar dataKey="actual" fill="#10B981" radius={[4, 4, 0, 0]} animationDuration={1000} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard delay={0.1}>
            <h2 className="font-display text-lg font-bold mb-4">Budget Allocation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="value" animationDuration={1000}>
                  {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: '#8B949E', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          {timeline.length > 0 && (
            <GlassCard delay={0.2} className="lg:col-span-2">
              <h2 className="font-display text-lg font-bold mb-4">Debt Payoff Trajectory</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 14% 15%)" />
                  <XAxis dataKey="month" stroke="#8B949E" tick={{ fontSize: 11 }} label={{ value: 'Months', position: 'bottom', fill: '#8B949E', fontSize: 11 }} />
                  <YAxis stroke="#8B949E" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="totalDebt" stroke="#F0B429" strokeWidth={2} dot={false} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
