import { useState } from 'react';
import { useStore, generateId, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Receipt, Trash2, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseTracker() {
  const { events, expenses, addExpense, deleteExpense, updateResource } = useStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expenseDialog, setExpenseDialog] = useState<{ eventId: string; resourceId: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const handleLogExpense = () => {
    if (!expenseDialog || !amount || !date) {
      toast.error('Please fill in amount and date');
      return;
    }
    const { eventId, resourceId } = expenseDialog;
    const numAmount = Number(amount);
    addExpense({ id: generateId(), eventId, resourceId, amount: numAmount, date, note });
    const ev = events.find((e) => e.id === eventId);
    const resource = ev?.resources.find((r) => r.id === resourceId);
    if (resource) {
      updateResource(eventId, resourceId, { actualCost: resource.actualCost + numAmount });
    }
    toast.success('Expense logged');
    setExpenseDialog(null);
    setAmount('');
    setDate('');
    setNote('');
  };

  const eventsWithResources = events.filter((e) => e.resources.length > 0);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex items-end gap-4">
          <span className="section-number text-electric/20">01</span>
          <div>
            <h1 className="font-display text-4xl font-extrabold text-foreground" style={{ letterSpacing: '-0.03em' }}>Expense Tracker</h1>
            <p className="text-muted-foreground mt-1 text-sm">Click on any resource to log an expense directly</p>
          </div>
        </div>
        <hr className="gold-rule" />
      </motion.div>

      {eventsWithResources.length === 0 ? (
        <EmptyState icon={Receipt} title="No events with resources" description="Create an event with resources using the AI Event Planner to start tracking expenses here." />
      ) : (
        <div className="space-y-6">
          {eventsWithResources.map((ev, i) => {
            const totalEst = ev.resources.reduce((s, r) => s + r.estimatedCost, 0);
            const totalAct = ev.resources.reduce((s, r) => s + r.actualCost, 0);
            const overBudget = totalAct > ev.budget;

            return (
              <GlassCard key={ev.id} delay={i * 0.05}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{ev.name}</h3>
                    <div className="flex gap-3 mt-1">
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{ev.type}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">{ev.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Budget: <span className="font-mono text-primary font-bold">{formatCurrency(ev.budget)}</span></p>
                    <p className={`text-xs font-mono font-bold ${overBudget ? 'text-destructive' : 'text-success'}`}>
                      Spent: {formatCurrency(totalAct)} / {formatCurrency(totalEst)} est
                    </p>
                  </div>
                </div>

                {/* Budget gauge */}
                <div className="mb-4">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ev.budget > 0 ? (totalAct / ev.budget) * 100 : 0)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${overBudget ? 'bg-destructive' : 'bg-success'}`}
                    />
                  </div>
                </div>

                {/* Resources as clickable cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ev.resources.map((r) => {
                    const diff = r.actualCost - r.estimatedCost;
                    const isOver = diff > 0;
                    const resourceExpenses = expenses.filter((ex) => ex.eventId === ev.id && ex.resourceId === r.id);

                    return (
                      <div
                        key={r.id}
                        className={`rounded-lg bg-muted/20 border border-border p-3 cursor-pointer hover:border-primary/50 hover:-translate-y-0.5 transition-all group ${isOver ? 'border-l-2 border-l-destructive' : 'border-l-2 border-l-success'}`}
                        onClick={() => { setExpenseDialog({ eventId: ev.id, resourceId: r.id }); setDate(new Date().toISOString().split('T')[0]); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-border text-[10px] font-mono">{r.category}</Badge>
                            <span className="text-sm font-medium text-foreground">{r.name}</span>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <span className="text-[10px] text-muted-foreground font-mono">Est: {formatCurrency(r.estimatedCost)}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">Act: {formatCurrency(r.actualCost)}</span>
                          </div>
                          <span className={`text-[10px] font-bold font-mono flex items-center gap-1 ${isOver ? 'text-destructive' : 'text-success'}`}>
                            {isOver ? <AlertTriangle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                            {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                          </span>
                        </div>

                        {/* Recent expenses for this resource */}
                        {resourceExpenses.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                            {resourceExpenses.slice(-3).map((ex) => (
                              <div key={ex.id} className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground font-mono">{ex.date} {ex.note && `— ${ex.note}`}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-primary font-mono font-bold">{formatCurrency(ex.amount)}</span>
                                  <button
                                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(ex.id); }}
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {resourceExpenses.length > 3 && (
                              <p className="text-[9px] text-muted-foreground">+{resourceExpenses.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Quick expense dialog */}
      <Dialog open={!!expenseDialog} onOpenChange={() => setExpenseDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Log Expense — {(() => {
                if (!expenseDialog) return '';
                const ev = events.find((e) => e.id === expenseDialog.eventId);
                const r = ev?.resources.find((r) => r.id === expenseDialog.resourceId);
                return r?.name || '';
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="label-caps text-muted-foreground">Amount (₹)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-muted/30 border-border mt-1" autoFocus />
            </div>
            <div>
              <Label className="label-caps text-muted-foreground">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted/30 border-border mt-1" />
            </div>
            <div>
              <Label className="label-caps text-muted-foreground">Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Advance payment" className="bg-muted/30 border-border mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(null)} className="border-border">Cancel</Button>
            <Button onClick={handleLogExpense} className="btn-primary-gradient text-primary-foreground font-bold">Log Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { deleteExpense(deleteTarget); toast.success('Expense deleted'); setDeleteTarget(null); } }} />
    </div>
  );
}
