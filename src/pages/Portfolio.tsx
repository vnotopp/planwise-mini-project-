import { useState, useMemo } from 'react';
import { useStore, formatCurrency, generateId, type Asset, type AssetCategory } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Building2, Landmark, Gem, Shield, Store, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_ICONS: Record<AssetCategory, typeof TrendingUp> = {
  'Investment': TrendingUp,
  'Real Estate': Building2,
  'Bank & Deposits': Landmark,
  'Precious Metals': Gem,
  'Insurance': Shield,
  'Business': Store,
};

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  'Investment': '#3B82F6',
  'Real Estate': '#F0B429',
  'Bank & Deposits': '#10B981',
  'Precious Metals': '#F59E0B',
  'Insurance': '#8B5CF6',
  'Business': '#EC4899',
};

const LIQUID_CATEGORIES: AssetCategory[] = ['Bank & Deposits', 'Investment'];

const assetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  currentValue: z.coerce.number().min(0),
  purchaseValue: z.coerce.number().optional(),
  purchaseDate: z.string().optional(),
  annualReturn: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type AssetForm = z.infer<typeof assetSchema>;

function getAprBadge(rate: number) {
  if (rate === 0) return { label: 'Interest Free', className: 'bg-muted text-muted-foreground' };
  if (rate < 12) return { label: 'Low', className: 'bg-success/20 text-success' };
  if (rate <= 24) return { label: 'Medium', className: 'bg-warning/20 text-warning' };
  return { label: 'High Interest', className: 'bg-destructive/20 text-destructive' };
}

function calculateAssetHealthScore(
  assets: Asset[],
  totalLiabilities: number,
  monthlyExpenses: number
) {
  const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);
  const categories = new Set(assets.map(a => a.category));
  const liquidAssets = assets.filter(a => LIQUID_CATEGORIES.includes(a.category)).reduce((s, a) => s + a.currentValue, 0);
  const investmentTotal = assets.filter(a => a.category === 'Investment').reduce((s, a) => s + a.currentValue, 0);

  // Factor 1: Diversification (25 pts)
  let diversification = 0;
  if (categories.size >= 5) diversification = 25;
  else if (categories.size >= 3) diversification = 15;
  else if (categories.size >= 2) diversification = 8;

  // Factor 2: Liquidity Ratio (25 pts)
  let liquidity = 0;
  const monthsCovered = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : (liquidAssets > 0 ? 12 : 0);
  if (monthsCovered > 6) liquidity = 25;
  else if (monthsCovered >= 3) liquidity = 15;
  else if (monthsCovered >= 1) liquidity = 8;

  // Factor 3: Debt to Asset Ratio (25 pts)
  let dta = 25;
  if (totalAssets > 0) {
    const ratio = (totalLiabilities / totalAssets) * 100;
    if (ratio < 10) dta = 25;
    else if (ratio <= 20) dta = 18;
    else if (ratio <= 40) dta = 10;
    else dta = 0;
  }

  // Factor 4: Investment Ratio (25 pts)
  let investmentScore = 0;
  if (totalAssets > 0) {
    const ratio = (investmentTotal / totalAssets) * 100;
    if (ratio > 20) investmentScore = 25;
    else if (ratio >= 10) investmentScore = 15;
    else if (ratio >= 5) investmentScore = 8;
  }

  return { total: diversification + liquidity + dta + investmentScore, diversification, liquidity, dta, investmentScore, monthsCovered };
}

interface AiAnalysis {
  summary: string;
  strengths: string[];
  warnings: string[];
  recommendations: string[];
  liquidityStatus: string;
  investmentAdvice: string;
}

export default function Portfolio() {
  const { assets, debts, monthlyIncome, monthlySavings, addAsset, updateAsset, deleteAsset } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

  const totalAssets = useMemo(() => assets.reduce((s, a) => s + a.currentValue, 0), [assets]);
  const totalLiabilities = useMemo(() => debts.reduce((s, d) => s + d.principal, 0), [debts]);
  const netWorth = totalAssets - totalLiabilities;
  const monthlyExpenses = monthlyIncome - monthlySavings;

  const healthScore = useMemo(
    () => calculateAssetHealthScore(assets, totalLiabilities, monthlyExpenses > 0 ? monthlyExpenses : 0),
    [assets, totalLiabilities, monthlyExpenses]
  );

  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    assets.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [assets]);

  const chartData = useMemo(() => {
    const cats: Record<string, number> = {};
    assets.forEach(a => { cats[a.category] = (cats[a.category] || 0) + a.currentValue; });
    return Object.entries(cats).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name as AssetCategory] || '#888',
    }));
  }, [assets]);

  const liquidAssets = useMemo(() => assets.filter(a => LIQUID_CATEGORIES.includes(a.category)).reduce((s, a) => s + a.currentValue, 0), [assets]);
  const illiquidAssets = totalAssets - liquidAssets;

  const dtiPercent = totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : '0.0';
  const healthLabel = healthScore.total >= 75 ? 'Excellent' : healthScore.total >= 50 ? 'Good' : healthScore.total >= 25 ? 'Needs Attention' : 'Critical';

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
  });

  const openAddModal = () => { setEditingAsset(null); reset({ name: '', category: '', currentValue: 0 }); setModalOpen(true); };
  const openEditModal = (asset: Asset) => { setEditingAsset(asset); reset(asset); setModalOpen(true); };

  const onSubmit = (data: AssetForm) => {
    if (editingAsset) {
      updateAsset(editingAsset.id, data as Partial<Asset>);
      toast.success('Asset updated');
    } else {
      addAsset({ id: generateId(), ...data } as Asset);
      toast.success('Asset added');
    }
    setModalOpen(false);
  };

  const analyzePortfolio = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    const summary = `Assets: ${assets.map(a => `${a.name} (${a.category}): ${formatCurrency(a.currentValue)}`).join(', ')}. Total Assets: ${formatCurrency(totalAssets)}. Total Liabilities: ${formatCurrency(totalLiabilities)}. Net Worth: ${formatCurrency(netWorth)}. DTI: ${dtiPercent}%. Liquid Assets: ${formatCurrency(liquidAssets)} (${healthScore.monthsCovered.toFixed(1)} months expenses). Debts: ${debts.map(d => `${d.name}: ${formatCurrency(d.principal)} at ${d.interestRate}%`).join(', ')}.`;
    try {
      const { data, error } = await supabase.functions.invoke('ai-portfolio-analyzer', { body: { portfolio: summary } });
      if (error) throw error;
      if (data) setAiAnalysis(data);
    } catch {
      toast.error('Failed to analyze portfolio. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const healthColor = healthScore.total >= 75 ? 'text-success' : healthScore.total >= 50 ? 'text-primary' : healthScore.total >= 25 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex items-end gap-4 justify-between">
          <div className="flex items-end gap-4">
            <span className="section-number">05</span>
            <div>
              <h1 className="font-display text-foreground" style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Portfolio & Net Worth
              </h1>
              <p className="text-muted-foreground text-sm mt-1 font-body">Your complete financial picture in one place</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={openAddModal} className="btn-primary-gradient text-primary-foreground font-bold">
              <Plus className="h-4 w-4 mr-1" /> Add Asset
            </Button>
            <Button variant="outline" onClick={() => { /* liabilities come from debts */ }} asChild>
              <Link to="/debts"><Plus className="h-4 w-4 mr-1" /> Add Liability</Link>
            </Button>
          </div>
        </div>
        <hr className="gold-rule mt-4" />
      </motion.div>

      {/* Net Worth Hero */}
      <GlassCard delay={0.05} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="label-caps text-muted-foreground tracking-widest">Your Net Worth</span>
          <div className="flex items-end justify-between mt-3 flex-wrap gap-4">
            <div>
              <span className={`font-mono block ${netWorth >= 0 ? 'text-primary' : 'text-destructive'}`} style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>
                {formatCurrency(netWorth)}
              </span>
              <div className="h-2 rounded-full bg-muted mt-4 w-64 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalAssets > 0 ? Math.min(100, ((totalAssets - totalLiabilities) / totalAssets) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <span className="label-caps text-muted-foreground">Total Assets</span>
              <AnimatedCounter value={totalAssets} className="font-mono text-success block mt-1" style={{ fontSize: '1.5rem', fontWeight: 700 }} />
            </div>
            <div>
              <span className="label-caps text-muted-foreground">Total Liabilities</span>
              <AnimatedCounter value={totalLiabilities} className="font-mono text-destructive block mt-1" style={{ fontSize: '1.5rem', fontWeight: 700 }} />
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Financial Health: <span className={`font-bold ${healthColor}`}>{healthLabel}</span> — DTI {dtiPercent}%
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Assets */}
          <div className="space-y-2">
            <div className="flex items-end gap-4">
              <span className="section-number">06</span>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>Your Assets</h2>
                <Badge variant="secondary" className="font-mono text-xs">{assets.length}</Badge>
              </div>
            </div>
            <hr className="gold-rule" />
          </div>

          {assets.length === 0 ? (
            <EmptyState icon={Briefcase} title="No assets yet" description="Add your first asset to start tracking your portfolio" action={<Button onClick={openAddModal} className="btn-primary-gradient text-primary-foreground font-bold"><Plus className="h-4 w-4 mr-1" /> Add Asset</Button>} />
          ) : (
            <Accordion type="multiple" defaultValue={Object.keys(groupedAssets)} className="space-y-3">
              {Object.entries(groupedAssets).map(([category, catAssets]) => {
                const Icon = CATEGORY_ICONS[category as AssetCategory] || Briefcase;
                const subtotal = catAssets.reduce((s, a) => s + a.currentValue, 0);
                return (
                  <AccordionItem key={category} value={category} className="editorial-card border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                        <span className="label-caps text-foreground font-bold tracking-wider">{category}</span>
                        <span className="ml-auto font-mono text-primary text-sm font-bold mr-4">{formatCurrency(subtotal)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="space-y-0">
                        {catAssets.map((asset, i) => {
                          const returns = asset.purchaseValue ? (((asset.currentValue - asset.purchaseValue) / asset.purchaseValue) * 100).toFixed(1) : null;
                          return (
                            <motion.div key={asset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                              className="flex items-center justify-between py-3 border-b border-border last:border-0 group">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{asset.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {returns && <span className="text-success">+{returns}% returns</span>}
                                  {asset.annualReturn && !returns && <span className="text-success">+{asset.annualReturn}% returns</span>}
                                  {asset.notes && <span className="ml-2">{asset.notes}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-primary font-bold text-sm">{formatCurrency(asset.currentValue)}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditModal(asset)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => { deleteAsset(asset.id); toast.success('Asset deleted'); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Liabilities */}
          <div className="space-y-2 mt-8">
            <div className="flex items-end gap-4">
              <span className="section-number">07</span>
              <h2 className="font-display text-2xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>Your Liabilities</h2>
            </div>
            <hr className="gold-rule" />
          </div>

          {debts.length === 0 ? (
            <GlassCard><p className="text-muted-foreground text-sm">No liabilities. Manage debts in the Debt Manager.</p></GlassCard>
          ) : (
            <GlassCard>
              <div className="space-y-3">
                {debts.map((d) => {
                  const badge = getAprBadge(d.interestRate);
                  return (
                    <div key={d.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{d.interestRate}% APR</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-destructive text-sm">{formatCurrency(d.principal)}</span>
                        <Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to="/debts" className="flex items-center gap-1 text-xs text-primary hover:underline mt-4 font-medium">
                Manage Debts <ArrowRight className="h-3 w-3" />
              </Link>
            </GlassCard>
          )}

          {/* AI Analyzer */}
          <div className="space-y-2 mt-8">
            <div className="flex items-end gap-4">
              <span className="section-number">08</span>
              <h2 className="font-display text-2xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>AI Portfolio Analyzer</h2>
            </div>
            <hr className="gold-rule" />
          </div>

          <GlassCard>
            <Button onClick={analyzePortfolio} disabled={aiLoading || assets.length === 0} className="btn-primary-gradient text-primary-foreground font-bold w-full h-11">
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? 'Analyzing...' : 'Analyze My Portfolio'}
            </Button>

            {aiLoading && (
              <div className="mt-4 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            )}

            {aiAnalysis && (
              <div className="mt-6 space-y-5">
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-sm text-foreground">{aiAnalysis.summary}</p>
                </div>

                {aiAnalysis.strengths?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="label-caps text-success tracking-wider">Strengths</h4>
                    {aiAnalysis.strengths.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="text-success">✓</span> {s}
                      </div>
                    ))}
                  </div>
                )}

                {aiAnalysis.warnings?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="label-caps text-warning tracking-wider">Warnings</h4>
                    {aiAnalysis.warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="text-warning">⚠</span> {w}
                      </div>
                    ))}
                  </div>
                )}

                {aiAnalysis.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="label-caps text-primary tracking-wider">Recommendations</h4>
                    {aiAnalysis.recommendations.map((r, i) => (
                      <div key={i} className="rounded-lg border-l-4 border-primary bg-muted/20 p-3">
                        <p className="text-sm text-foreground"><span className="font-mono text-primary font-bold">{i + 1}.</span> {r}</p>
                      </div>
                    ))}
                  </div>
                )}

                {aiAnalysis.investmentAdvice && (
                  <div className="rounded-lg bg-[hsl(180_60%_20%/0.15)] border border-[hsl(180_60%_40%/0.3)] p-4">
                    <h4 className="label-caps text-[hsl(180_60%_60%)] tracking-wider mb-2">Investment Advice</h4>
                    <p className="text-sm text-foreground">{aiAnalysis.investmentAdvice}</p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Allocation Chart */}
          <GlassCard delay={0.1}>
            <h3 className="font-display font-bold text-foreground mb-4">Asset Allocation</h3>
            {chartData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none">
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {chartData.map(d => {
                    const pct = totalAssets > 0 ? ((d.value / totalAssets) * 100).toFixed(0) : '0';
                    return (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                        <span className="text-muted-foreground flex-1">{d.name}</span>
                        <span className="font-mono text-foreground">{pct}%</span>
                        <span className="font-mono text-primary">{formatCurrency(d.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Add assets to see allocation</p>
            )}
          </GlassCard>

          {/* Liquidity Analysis */}
          <GlassCard delay={0.15}>
            <h3 className="font-display font-bold text-foreground mb-4">Liquidity Analysis</h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-success/10 border border-success/20 p-3">
                <span className="label-caps text-success text-[10px]">Liquid Assets</span>
                <p className="font-mono text-success font-bold mt-1">{formatCurrency(liquidAssets)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Covers {healthScore.monthsCovered.toFixed(1)} months of expenses
                  {healthScore.monthsCovered >= 6 && <span className="text-success ml-1">✓</span>}
                </p>
              </div>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <span className="label-caps text-destructive text-[10px]">Illiquid Assets</span>
                <p className="font-mono text-destructive font-bold mt-1">{formatCurrency(illiquidAssets)}</p>
                <p className="text-xs text-muted-foreground mt-1">Takes months to liquidate</p>
              </div>
            </div>
          </GlassCard>

          {/* Asset Health Score */}
          <GlassCard delay={0.2} className="flex flex-col items-center gap-4">
            <h3 className="font-display font-bold text-foreground">Asset Health</h3>
            <ProgressRing value={healthScore.total} size={160} strokeWidth={10} label="Score" />
            <span className={`font-display font-bold text-sm ${healthColor}`}>{healthLabel}</span>
            <div className="w-full space-y-2 mt-2">
              {[
                { label: 'Diversification', score: healthScore.diversification, max: 25 },
                { label: 'Liquidity', score: healthScore.liquidity, max: 25 },
                { label: 'Debt/Asset', score: healthScore.dta, max: 25 },
                { label: 'Investment', score: healthScore.investmentScore, max: 25 },
              ].map(f => {
                const pct = f.max > 0 ? (f.score / f.max) * 100 : 0;
                const barColor = pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-primary' : pct >= 30 ? 'bg-warning' : 'bg-destructive';
                return (
                  <div key={f.label} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{f.label}</span>
                      <span className="font-mono text-xs text-primary">{f.score}/{f.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${barColor}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Add/Edit Asset Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Asset Name</Label>
              <Input {...register('name')} placeholder="e.g. Nifty 50 SIP" className="mt-1" />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Category</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(['Investment', 'Real Estate', 'Bank & Deposits', 'Precious Metals', 'Insurance', 'Business'] as AssetCategory[]).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>Current Value (₹)</Label>
              <Input type="number" {...register('currentValue')} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Purchase Value (₹)</Label>
                <Input type="number" {...register('purchaseValue')} className="mt-1" />
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" {...register('purchaseDate')} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Annual Return %</Label>
              <Input type="number" step="0.1" {...register('annualReturn')} className="mt-1" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input {...register('notes')} placeholder="e.g. Matures Dec 2025" className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="btn-primary-gradient text-primary-foreground font-bold">
                {editingAsset ? 'Update' : 'Add Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
