import { useState } from 'react';
import { useStore, generateId, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const expenseSchema = z.object({
  eventId: z.string().min(1, 'Select event'),
  resourceId: z.string().min(1, 'Select resource'),
  amount: z.coerce.number().min(0),
  date: z.string().min(1),
  note: z.string(),
});

export default function ExpenseTracker() {
  const { events, expenses, addExpense, deleteExpense, updateResource } = useStore();
  const [dialog, setDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const form = useForm({ resolver: zodResolver(expenseSchema), defaultValues: { eventId: '', resourceId: '', amount: 0, date: '', note: '' } });
  const selectedEventId = form.watch('eventId');
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const onSubmit = (data: z.infer<typeof expenseSchema>) => {
    const id = generateId();
    const { eventId, resourceId, amount, date, note } = data;
    addExpense({ eventId, resourceId, amount, date, note, id });
    if (selectedEvent) {
      const resource = selectedEvent.resources.find((r) => r.id === data.resourceId);
      if (resource) {
        updateResource(data.eventId, data.resourceId, { actualCost: resource.actualCost + data.amount });
      }
    }
    toast.success('Expense logged');
    form.reset();
    setDialog(false);
  };

  // Group expenses by event
  const grouped = events.map((ev) => ({
    event: ev,
    expenses: expenses.filter((ex) => ex.eventId === ev.id),
  })).filter((g) => g.expenses.length > 0);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-muted-foreground mt-1">Log actual expenses and compare with estimates</p>
        </div>
        <Button onClick={() => { form.reset(); setDialog(true); }} className="bg-primary text-primary-foreground hover:bg-secondary" disabled={events.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Log Expense
        </Button>
      </motion.div>

      {grouped.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses logged" description="Log expenses against your events to track actual spending." />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ event: ev, expenses: exps }, i) => {
            const totalEst = ev.resources.reduce((s, r) => s + r.estimatedCost, 0);
            const totalAct = ev.resources.reduce((s, r) => s + r.actualCost, 0);
            return (
              <GlassCard key={ev.id} delay={i * 0.05}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">{ev.name}</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Est: {formatCurrency(totalEst)}</span>
                    <span className={totalAct > totalEst ? 'text-destructive' : 'text-success'}>Act: {formatCurrency(totalAct)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {exps.map((ex) => {
                    const resource = ev.resources.find((r) => r.id === ex.resourceId);
                    return (
                      <div key={ex.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                        <div>
                          <p className="text-sm text-foreground">{resource?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{ex.date} {ex.note && `— ${ex.note}`}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-display font-semibold text-foreground">{formatCurrency(ex.amount)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget(ex.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">Log Expense</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Event</Label>
              <Select value={selectedEventId} onValueChange={(v) => { form.setValue('eventId', v); form.setValue('resourceId', ''); }}>
                <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent className="glass-card border-border">
                  {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedEvent && (
              <div>
                <Label>Resource</Label>
                <Select value={form.watch('resourceId')} onValueChange={(v) => form.setValue('resourceId', v)}>
                  <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Select resource" /></SelectTrigger>
                  <SelectContent className="glass-card border-border">
                    {selectedEvent.resources.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Amount (₹)</Label><Input type="number" {...form.register('amount')} className="bg-muted/30 border-border" /></div>
            <div><Label>Date</Label><Input type="date" {...form.register('date')} className="bg-muted/30 border-border" /></div>
            <div><Label>Note</Label><Input {...form.register('note')} className="bg-muted/30 border-border" /></div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-secondary">Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { deleteExpense(deleteTarget); toast.success('Expense deleted'); setDeleteTarget(null); } }} />
    </div>
  );
}
