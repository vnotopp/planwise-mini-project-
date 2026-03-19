import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ProgressRing } from '@/components/ProgressRing';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Factor {
  label: string;
  score: number;
  max: number;
  tip: string;
}

function calculateHealthFactors(
  totalBudget: number,
  totalActual: number,
  totalEstimated: number,
  monthlyIncome: number,
  monthlySavings: number,
  totalMinPayment: number
): Factor[] {
  // 1. Budget Utilization (30 pts)
  let budgetUtil = 0;
  if (totalBudget > 0) {
    const ratio = totalActual / totalBudget;
    if (ratio < 0.7) budgetUtil = 30;
    else if (ratio <= 0.9) budgetUtil = 20;
    else if (ratio <= 1) budgetUtil = 10;
  } else if (totalActual === 0) {
    budgetUtil = 30;
  }

  // 2. Debt-to-Income (25 pts)
  let dti = 0;
  if (monthlyIncome > 0) {
    const ratio = totalMinPayment / monthlyIncome;
    if (ratio < 0.2) dti = 25;
    else if (ratio <= 0.35) dti = 15;
    else if (ratio <= 0.5) dti = 8;
  } else if (totalMinPayment === 0) {
    dti = 25;
  }

  // 3. Savings Rate (25 pts)
  let savings = 0;
  if (monthlyIncome > 0) {
    const ratio = monthlySavings / monthlyIncome;
    if (ratio > 0.3) savings = 25;
    else if (ratio >= 0.2) savings = 18;
    else if (ratio >= 0.1) savings = 10;
  } else if (monthlySavings > 0) {
    savings = 10;
  }

  // 4. Expense Accuracy (20 pts)
  let accuracy = 20;
  if (totalEstimated > 0) {
    const variance = Math.abs(totalActual - totalEstimated) / totalEstimated;
    if (variance < 0.05) accuracy = 20;
    else if (variance <= 0.15) accuracy = 12;
    else if (variance <= 0.3) accuracy = 6;
    else accuracy = 0;
  }

  return [
    { label: 'Budget Utilization', score: budgetUtil, max: 30, tip: 'Keep spending below 70% of budget for max score.' },
    { label: 'Debt-to-Income', score: dti, max: 25, tip: 'Keep monthly debt payments under 20% of income.' },
    { label: 'Savings Rate', score: savings, max: 25, tip: 'Save more than 30% of income for best results.' },
    { label: 'Expense Accuracy', score: accuracy, max: 20, tip: 'Keep actual spend within 5% of estimates.' },
  ];
}

function getLabel(score: number) {
  if (score >= 75) return { text: 'Excellent', color: 'text-success' };
  if (score >= 50) return { text: 'Good', color: 'text-primary' };
  if (score >= 25) return { text: 'Needs Attention', color: 'text-warning' };
  return { text: 'Critical', color: 'text-destructive' };
}

export function BudgetHealthScore() {
  const { events, debts, monthlyIncome, monthlySavings } = useStore();
  const [expanded, setExpanded] = useState(false);

  const totalBudget = events.reduce((s, e) => s + e.budget, 0);
  const totalActual = events.reduce((s, e) => s + e.resources.reduce((a, r) => a + r.actualCost, 0), 0);
  const totalEstimated = events.reduce((s, e) => s + e.resources.reduce((a, r) => a + r.estimatedCost, 0), 0);
  const totalMinPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);

  const factors = calculateHealthFactors(totalBudget, totalActual, totalEstimated, monthlyIncome, monthlySavings, totalMinPayment);
  const totalScore = factors.reduce((s, f) => s + f.score, 0);
  const label = getLabel(totalScore);

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="font-display text-lg font-bold text-foreground">Budget Health</h2>
      <ProgressRing value={totalScore} size={180} strokeWidth={10} label="Score" />
      <span className={`font-display font-bold text-sm ${label.color}`}>{label.text}</span>

      {/* Factor bars */}
      <div className="w-full space-y-3 mt-2">
        {factors.map((f) => {
          const pct = f.max > 0 ? (f.score / f.max) * 100 : 0;
          const barColor = pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-primary' : pct >= 30 ? 'bg-warning' : 'bg-destructive';
          return (
            <div key={f.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-card border-border text-foreground text-xs max-w-[200px]">
                      {f.tip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="font-mono text-xs text-primary">{f.score}/{f.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable explainer */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        What affects your score?
        <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full text-xs text-muted-foreground space-y-1.5 overflow-hidden"
          >
            <p><strong className="text-foreground">Budget Utilization (30 pts):</strong> How much of your event budget you've spent. Under 70% is ideal.</p>
            <p><strong className="text-foreground">Debt-to-Income (25 pts):</strong> Your monthly debt payments as a percentage of income. Under 20% is healthy.</p>
            <p><strong className="text-foreground">Savings Rate (25 pts):</strong> How much of your income goes to savings/debt repayment. Over 30% is excellent.</p>
            <p><strong className="text-foreground">Expense Accuracy (20 pts):</strong> How close your actual spending is to estimates. Under 5% variance is best.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
