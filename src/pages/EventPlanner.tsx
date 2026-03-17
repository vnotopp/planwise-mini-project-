import { useState } from 'react';
import { useStore, generateId, formatCurrency, type PlanEvent, type Resource, type ResourceCategory } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Trash2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const eventSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1, 'Type required'),
  date: z.string().min(1, 'Date required'),
  budget: z.coerce.number().min(0, 'Must be positive'),
});

const resourceSchema = z.object({
  name: z.string().min(1, 'Name required'),
  category: z.string().min(1, 'Category required'),
  estimatedCost: z.coerce.number().min(0),
  actualCost: z.coerce.number().min(0),
});

const CATEGORIES: ResourceCategory[] = ['Food', 'Venue', 'Decor', 'Transport', 'Misc'];

export default function EventPlanner() {
  const { events, addEvent, updateEvent, deleteEvent, addResource, deleteResource } = useStore();
  const [eventDialog, setEventDialog] = useState(false);
  const [resourceDialog, setResourceDialog] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<PlanEvent | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const eventForm = useForm({ resolver: zodResolver(eventSchema), defaultValues: { name: '', type: '', date: '', budget: 0 } });
  const resourceForm = useForm({ resolver: zodResolver(resourceSchema), defaultValues: { name: '', category: 'Food', estimatedCost: 0, actualCost: 0 } });

  const onSubmitEvent = (data: z.infer<typeof eventSchema>) => {
    if (editEvent) {
      updateEvent(editEvent.id, data);
      toast.success('Event updated');
    } else {
      addEvent({ ...data, id: generateId(), resources: [] });
      toast.success('Event created');
    }
    eventForm.reset();
    setEditEvent(null);
    setEventDialog(false);
  };

  const onSubmitResource = (data: z.infer<typeof resourceSchema>) => {
    if (!resourceDialog) return;
    addResource(resourceDialog, { ...data, id: generateId(), category: data.category as ResourceCategory });
    toast.success('Resource added');
    resourceForm.reset();
    setResourceDialog(null);
  };

  const openEditEvent = (ev: PlanEvent) => {
    setEditEvent(ev);
    eventForm.reset({ name: ev.name, type: ev.type, date: ev.date, budget: ev.budget });
    setEventDialog(true);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Event Planner</h1>
          <p className="text-muted-foreground mt-1">Plan and manage your event budgets</p>
        </div>
        <Button onClick={() => { setEditEvent(null); eventForm.reset(); setEventDialog(true); }} className="bg-primary text-primary-foreground hover:bg-secondary">
          <Plus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </motion.div>

      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" description="Create your first event to start planning resources and tracking budgets." />
      ) : (
        <div className="space-y-4">
          {events.map((ev, i) => {
            const totalEst = ev.resources.reduce((s, r) => s + r.estimatedCost, 0);
            const totalAct = ev.resources.reduce((s, r) => s + r.actualCost, 0);
            const overBudget = totalAct > ev.budget;
            const expanded = expandedEvent === ev.id;

            return (
              <GlassCard key={ev.id} delay={i * 0.05}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedEvent(expanded ? null : ev.id)}>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-foreground">{ev.name}</h3>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <Badge variant="outline" className="border-border text-muted-foreground">{ev.type}</Badge>
                        <span className="text-xs text-muted-foreground">{ev.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(ev.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-display font-bold text-foreground">{formatCurrency(ev.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated</p>
                      <p className="font-display font-bold text-foreground">{formatCurrency(totalEst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className={`font-display font-bold ${overBudget ? 'text-destructive' : 'text-success'}`}>{formatCurrency(totalAct)}</p>
                    </div>
                  </div>

                  {/* Budget gauge */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Spent</span>
                      <span>{ev.budget > 0 ? Math.round((totalAct / ev.budget) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${overBudget ? 'bg-destructive' : 'bg-success'}`}
                        style={{ width: `${Math.min(100, ev.budget > 0 ? (totalAct / ev.budget) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">Resources</h4>
                        <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => { resourceForm.reset(); setResourceDialog(ev.id); }}>
                          <Plus className="mr-1 h-3 w-3" /> Add Resource
                        </Button>
                      </div>
                      {ev.resources.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No resources added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {ev.resources.map((r) => {
                            const diff = r.actualCost - r.estimatedCost;
                            return (
                              <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="border-border text-xs">{r.category}</Badge>
                                  <span className="text-sm text-foreground">{r.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-muted-foreground">Est: {formatCurrency(r.estimatedCost)}</span>
                                  <span className="text-xs text-muted-foreground">Act: {formatCurrency(r.actualCost)}</span>
                                  <span className={`text-xs font-semibold ${diff > 0 ? 'text-destructive' : 'text-success'}`}>
                                    {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                                  </span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteResource(ev.id, r.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Event Dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editEvent ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
          <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-4">
            <div><Label>Name</Label><Input {...eventForm.register('name')} className="bg-muted/30 border-border" /></div>
            <div><Label>Type</Label><Input {...eventForm.register('type')} placeholder="e.g. Wedding, Party" className="bg-muted/30 border-border" /></div>
            <div><Label>Date</Label><Input type="date" {...eventForm.register('date')} className="bg-muted/30 border-border" /></div>
            <div><Label>Budget (₹)</Label><Input type="number" {...eventForm.register('budget')} className="bg-muted/30 border-border" /></div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-secondary">{editEvent ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={!!resourceDialog} onOpenChange={() => setResourceDialog(null)}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle className="font-display">Add Resource</DialogTitle></DialogHeader>
          <form onSubmit={resourceForm.handleSubmit(onSubmitResource)} className="space-y-4">
            <div><Label>Name</Label><Input {...resourceForm.register('name')} className="bg-muted/30 border-border" /></div>
            <div>
              <Label>Category</Label>
              <Select value={resourceForm.watch('category')} onValueChange={(v) => resourceForm.setValue('category', v)}>
                <SelectTrigger className="bg-muted/30 border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-border">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Estimated Cost (₹)</Label><Input type="number" {...resourceForm.register('estimatedCost')} className="bg-muted/30 border-border" /></div>
            <div><Label>Actual Cost (₹)</Label><Input type="number" {...resourceForm.register('actualCost')} className="bg-muted/30 border-border" /></div>
            <DialogFooter>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-secondary">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { deleteEvent(deleteTarget); toast.success('Event deleted'); setDeleteTarget(null); } }} title="Delete Event?" description="This will permanently delete this event and all its resources." />
    </div>
  );
}
