import { useState } from 'react';
import { useStore, formatCurrency } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DebtPlan {
  strategy: string;
  milestones: string[];
  investingTip: string;
  debtToIncomeRatio: string;
}

export function AiDebtAdvisor() {
  const { debts, monthlyIncome, monthlySavings } = useStore();
  const [plan, setPlan] = useState<DebtPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (debts.length === 0) {
      toast.error('Add debts first to get a plan');
      return;
    }
    setLoading(true);
    setPlan(null);

    const profile = [
      `Monthly Income: ${formatCurrency(monthlyIncome)}`,
      `Monthly Savings for Debt: ${formatCurrency(monthlySavings)}`,
      '',
      'Debts:',
      ...debts.map(
        (d) =>
          `- ${d.name}: Principal ${formatCurrency(d.principal)}, Interest ${d.interestRate}%, Min Payment ${formatCurrency(d.minimumPayment)}/mo`
      ),
    ].join('\n');

    try {
      const { data, error } = await supabase.functions.invoke('ai-debt-advisor', {
        body: { profile },
      });
      if (error) throw error;
      if (data?.plan) setPlan(data.plan);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate debt plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDtiBadgeColor = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('healthy')) return 'bg-success/20 text-success border-success/30';
    if (lower.includes('caution')) return 'bg-primary/20 text-primary border-primary/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  return (
    <GlassCard delay={0.35} className="border-primary/20">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold">AI Debt Minimizer</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Your personalized path to financial freedom</p>

      <Button onClick={generate} disabled={loading} className="w-full btn-primary-gradient text-primary-foreground font-bold h-11">
        {loading ? 'Generating...' : 'Generate My Debt Plan'}
      </Button>

      {loading && (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {!loading && plan && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-muted/20 p-4 border border-border">
            <p className="font-display font-bold text-sm text-primary mb-1">Recommended Strategy</p>
            <p className="text-sm text-foreground">{plan.strategy}</p>
          </div>

          {plan.milestones && plan.milestones.length > 0 && (
            <div className="rounded-lg bg-muted/20 p-4 border border-border">
              <p className="font-display font-bold text-sm text-primary mb-3">Key Milestones</p>
              <div className="space-y-3">
                {plan.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.investingTip && (
            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="font-display font-bold text-sm text-primary">Investing Tip</p>
              </div>
              <p className="text-sm text-foreground">{plan.investingTip}</p>
            </div>
          )}

          {plan.debtToIncomeRatio && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Debt-to-Income:</span>
              <Badge variant="outline" className={`${getDtiBadgeColor(plan.debtToIncomeRatio)} text-xs font-bold font-mono px-3 py-1`}>
                {plan.debtToIncomeRatio}
              </Badge>
            </div>
          )}

          <button onClick={() => generate()} className="flex items-center gap-1 text-xs text-primary hover:text-secondary transition-colors">
            <RefreshCw className="h-3 w-3" /> Regenerate Plan
          </button>
        </div>
      )}
    </GlassCard>
  );
}
