import { useState } from 'react';
import { useStore, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Tip {
  tip: string;
  detail: string;
}

export function AiBudgetAdvisor() {
  const { events } = useStore();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);

  const hasResources = events.some((e) => e.resources.length > 0);

  const analyze = async () => {
    if (!hasResources) {
      toast.error('Add resources to your events first');
      return;
    }
    setLoading(true);
    setTips([]);

    const eventSummary = events
      .map((ev) => {
        const resources = ev.resources
          .map((r) => `  - ${r.name} (${r.category}): Est ${formatCurrency(r.estimatedCost)}, Act ${formatCurrency(r.actualCost)}`)
          .join('\n');
        return `Event: ${ev.name} (Budget: ${formatCurrency(ev.budget)})\n${resources}`;
      })
      .join('\n\n');

    try {
      const { data, error } = await supabase.functions.invoke('ai-budget-advisor', {
        body: { events: eventSummary },
      });
      if (error) throw error;
      if (data?.tips) setTips(data.tips);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard delay={0.3} className="border-primary/20">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold">AI Budget Minimizer</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Get personalized suggestions to reduce your event costs</p>

      <Button onClick={analyze} disabled={loading} className="w-full btn-primary-gradient text-primary-foreground font-bold h-11">
        {loading ? 'Analyzing...' : 'Analyze My Budget'}
      </Button>

      {loading && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 items-start animate-pulse">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tips.length > 0 && (
        <div className="mt-4 space-y-3">
          {tips.map((t, i) => (
            <div key={i} className="rounded-lg border-l-4 border-primary bg-muted/20 p-3">
              <p className="font-display font-bold text-sm text-foreground">{i + 1}. {t.tip}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.detail}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
