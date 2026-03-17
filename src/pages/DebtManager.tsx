import { useState, useMemo } from 'react';
import { useStore, generateId, formatCurrency, type Debt } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Landmark, Plus, Trash2, Lightbulb } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const debtSchema = z.object({
  name: z.string().min(1),
  principal: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0),
  minimumPayment: z.coerce.number().min(0),
});

const COLORS = ['#F59E0B', '#D97706', '#10B981', '#EF4444', '#6366F1', '#EC4899'];

function getSmartTips(dti: number): string[] {
  if (dti > 0.5) return [
    'Your debt-to-income ratio is high. Consider the avalanche method to minimize interest.',
    'Try to increase income streams or cut discretionary spending aggressively.',
    'Consider debt consolidation to lower average interest rates.',
  ];
  if (dti > 0.3) return [
    'You are in a manageable range. Focus on paying off highest-interest debt first.',
    'Try to allocate at least 20% of income toward debt repayment.',
  ];
  return [
    'Great job! Your debt is well-managed. Keep building your emergency fund.',
    'Consider investing extra savings for long-term wealth growth.',
  ];
}

function calculateAvalanche(debts: Debt[], monthlySavings: number) {
  if (debts.length === 0 || monthlySavings <= 0) return [];

  let remaining = debts.map((d) => ({ ...d, balance: d.principal }));
  const timeline: { month: number; totalDebt: number }[] = [];
  let month = 0;

  while (remaining.some((d) => d.balance > 0) && month < 600) {
    month++;
    // Add interest
    remaining = remaining.map((d) => ({
      ...d,
      balance: d.balance > 0 ? d.balance * (1 + d.interestRate / 100 / 12) : 0,
    }));

    // Pay minimums
    let extraBudget = monthlySavings;
    remaining = remaining.map((d) => {
      if (d.balance <= 0) return d;
      const payment = Math.min(d.minimumPayment, d.balance);
      extraBudget -= payment;
      return { ...d, balance: Math.max(0, d.balance - payment) };
    });

    // Avalanche: pay extra to highest interest first
    const sorted = [...remaining].filter((d) => d.balance > 0).sort((a, b) => b.interestRate - a.interestRate);
    for (const debt of sorted) {
      if (extraBudget <= 0) break;
      const idx = remaining.findIndex((d) => d.id === debt.id);
      const payment = Math.min(extraBudget, remaining[idx].balance);
      remaining[idx].balance = Math.max(0, remaining[idx].balance - payment);
      extraBudget -= payment;
    }

    const totalDebt = remaining.reduce((s, d) => s + d.balance, 0);
    timeline.push({ month, totalDebt: Math.round(totalDebt) });
    if (totalDebt <= 0) break;
  }
  return timeline;
}

export default function DebtManager() {
  const { debts, monthlyIncome, monthlySavings, addDebt, deleteDebt, setMonthlyIncome, setMonthlySavings } = useStore();
  const [dialog, setDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(debtSchema), defaultValues: { name: '', principal: 0, interestRate: 0, minimumPayment: 0 } });

  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);
  const dti = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0;
  const tips = getSmartTips(dti);
  const timeline = useMemo(() => calculateAvalanche(debts, monthlySavings), [debts, monthlySavings]);
  const monthsToFree = timeline.length > 0 ? timeline[timeline.length - 1].month : 0;

  const pieData = debts.map((d) => ({ name: d.name, value: d.principal }));

  const onSubmit = (data: z.infer<typeof debtSchema>) => {
    addDebt({ ...data, id: generateId() });
    toast.success('Debt added');
    form.reset();
    setDialog(false);
  };

  // Avalanche priority order
  const priorityDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Debt Manager</h1>
          <p className="text-muted-foreground mt-1">Track debts and plan your path to freedom</p>
        </div>
        <Button onClick={() => { form.reset(); setDialog(true); }} className="bg-primary text-primary-foreground hover:bg-secondary">
          <Plus className="mr-2 h-4 w-4" /> Add Debt
        </Button>
      </motion.div>

      {/* Income / Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <Label className="text-muted-foreground text-xs">Monthly Income (₹)</Label>
          <Input type="number" value={monthlyIncome || ''} onChange={(e) => setMonthlyIncome(Number(e.target.value))} className="bg-muted/30 border-border mt-1 font-display text-lg" />
        </GlassCard>
        <GlassCard delay={0.1}>
          <Label className="text-muted-foreground text-xs">Monthly Savings for Debt (₹)</Label>
          <Input type="number" value={monthlySavings || ''} onChange={(e) => setMonthlySavings(Number(e.target.value))} className="bg-muted/30 border-border mt-1 font-display text-lg" />
        </GlassCard>
      </div>

      {debts.length === 0 ? (
        <EmptyState icon={Landmark} title="No debts recorded" description="Add your debts to get a personalized repayment strategy." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Debts + Priority */}
          <div className="space-y-4">
            <GlassCard delay={0.1}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold">Your Debts</h2>
                <AnimatedCounter value={totalDebt} className="font-display text-xl font-bold text-primary" />
              </div>
              <div className="space-y-2">
                {debts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.interestRate}% APR · Min: {formatCurrency(d.minimumPayment)}/mo</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-semibold text-foreground">{formatCurrency(d.principal)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget(d.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard delay={0.2}>
              <h2 className="font-display text-lg font-semibold mb-3">Repayment Priority <span className="text-xs font-body text-muted-foreground">(Avalanche Method)</span></h2>
              <div className="space-y-2">
                {priorityDebts.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="text-sm text-foreground flex-1">{d.name}</span>
                    <span className="text-xs text-destructive font-semibold">{d.interestRate}%</span>
                  </div>
                ))}
              </div>
              {monthlySavings > 0 && monthsToFree > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Projected debt-free in <span className="font-display font-bold text-primary">{monthsToFree} months</span>
                </p>
              )}
            </GlassCard>
          </div>

          {/* Right: Charts */}
          <div className="space-y-4">
            <GlassCard delay={0.15}>
              <h2 className="font-display text-lg font-semibold mb-4">Debt Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" animationBegin={0} animationDuration={1000}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid hsl(220 26% 14%)', borderRadius: '8px', color: '#F9FAFB' }} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>

            {timeline.length > 0 && (
              <GlassCard delay={0.25}>
                <h2 className="font-display text-lg font-semibold mb-4">Payoff Projection</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 26% 14%)" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} label={{ value: 'Months', position: 'bottom', fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid hsl(220 26% 14%)', borderRadius: '8px', color: '#F9FAFB' }} />
                    <Line type="monotone" dataKey="totalDebt" stroke="#F59E0B" strokeWidth={2} dot={false} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* Smart Tips */}
      {debts.length > 0 && (
        <GlassCard delay={0.3} className="border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Smart Tips</h2>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span> {tip}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">Add Debt</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>Name</Label><Input {...form.register('name')} className="bg-muted/30 border-border" /></div>
            <div><Label>Principal Amount (₹)</Label><Input type="number" {...form.register('principal')} className="bg-muted/30 border-border" /></div>
            <div><Label>Interest Rate (%)</Label><Input type="number" step="0.1" {...form.register('interestRate')} className="bg-muted/30 border-border" /></div>
            <div><Label>Minimum Monthly Payment (₹)</Label><Input type="number" {...form.register('minimumPayment')} className="bg-muted/30 border-border" /></div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-secondary">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { deleteDebt(deleteTarget); toast.success('Debt deleted'); setDeleteTarget(null); } }} />
    </div>
  );
}
