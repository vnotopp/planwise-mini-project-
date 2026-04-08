import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wand2, RefreshCw, PlusCircle, Pencil, Check, X, Users, IndianRupee, MapPin, Crown, Building2, Sparkles, Star, BarChart2, HelpCircle, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useStore, generateId, formatCurrency, type ResourceCategory } from '@/store/useStore';

// Types
interface Extraction {
  eventType: string | null;
  guests: string | null;
  budget: string | null;
  location: string | null;
  formality: string | null;
  venue: string | null;
  specialNotes: string | null;
  confidenceScore: number;
  followUpQuestion: string | null;
  followUpOptions: string[] | null;
  scaleScore: number;
}

interface Suggestion {
  category: string;
  title: string;
  detail?: string;
  advice?: string;
  saving?: string;
  tip?: string;
}

type FlowStep = 'input' | 'extracting' | 'review' | 'generating' | 'results';

const FIELD_CONFIG = [
  { key: 'eventType', label: 'Event Type', icon: CalendarDays },
  { key: 'guests', label: 'Guests', icon: Users },
  { key: 'budget', label: 'Budget', icon: IndianRupee },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'formality', label: 'Formality', icon: Crown },
  { key: 'venue', label: 'Venue', icon: Building2 },
  { key: 'specialNotes', label: 'Special Notes', icon: Star },
] as const;

const SCALE_CONFIG = [
  { max: 20, label: 'Intimate', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { max: 40, label: 'Small', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { max: 60, label: 'Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { max: 80, label: 'Large', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { max: 100, label: 'Mega', color: 'bg-primary/20 text-primary border-primary/30' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Venue: 'bg-accent/20 text-accent border-accent/30',
  Food: 'bg-success/20 text-success border-success/30',
  Decor: 'bg-primary/20 text-primary border-primary/30',
  Entertainment: 'bg-coral/20 text-coral border-coral/30',
  Budget: 'bg-warning/20 text-warning border-warning/30',
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  Venue: 35, Food: 30, Decor: 15, Entertainment: 12, Budget: 8,
};

function getScaleInfo(score: number) {
  return SCALE_CONFIG.find(s => score <= s.max) || SCALE_CONFIG[SCALE_CONFIG.length - 1];
}

function getConfidenceConfig(score: number) {
  if (score >= 90) return { color: '#10B981', bg: 'bg-emerald-500', msg: 'Excellent detail! Crafting perfect suggestions...' };
  if (score >= 70) return { color: '#F0B429', bg: 'bg-primary', msg: 'Great context! Generating premium suggestions...' };
  if (score >= 40) return { color: '#F59E0B', bg: 'bg-amber-500', msg: 'Good start! More detail = better suggestions' };
  return { color: '#EF4444', bg: 'bg-red-500', msg: 'Add more details for better suggestions' };
}

// ─── Confidence Indicator ────────────────────────────────────────────
function ConfidenceIndicator({ score, loading }: { score: number; loading: boolean }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const config = getConfidenceConfig(score);

  useEffect(() => {
    if (!loading && score > 0) {
      const duration = 1200;
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(eased * score));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [score, loading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[10px] border border-border bg-card p-5"
    >
      <p className="text-sm text-muted-foreground mb-3 font-body">
        {loading ? 'Analyzing your description...' : 'Analysis complete'}
      </p>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Detail Level</span>
        <span className="text-xs font-mono font-bold" style={{ color: config.color }}>{animatedScore}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        {loading ? (
          <div className="h-full w-full bg-muted-foreground/20 animate-pulse rounded-full" />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${animatedScore}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: config.color }}
          />
        )}
      </div>
      {!loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs mt-2 font-body"
          style={{ color: config.color }}
        >
          {config.msg}
        </motion.p>
      )}
    </motion.div>
  );
}

// ─── Follow-up Question Card ─────────────────────────────────────────
function FollowUpCard({
  question,
  options,
  onAnswer,
}: {
  question: string;
  options: string[] | null;
  onAnswer: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const [answered, setAnswered] = useState(false);

  const handleSelect = (opt: string) => {
    setSelected(opt);
    setAnswered(true);
    onAnswer(opt);
  };

  const handleCustom = () => {
    if (customAnswer.trim()) {
      setAnswered(true);
      onAnswer(customAnswer.trim());
    }
  };

  if (answered) {
    return (
      <motion.div
        initial={{ height: 'auto', opacity: 1 }}
        animate={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-[10px] border border-border bg-card p-5 border-l-[3px] border-l-primary"
    >
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-body font-semibold text-foreground">Quick Question</span>
      </div>
      <p className="text-sm font-body text-foreground mb-4 leading-relaxed">{question}</p>
      {options && options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-medium border transition-all ${
                selected === opt
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          placeholder="Or type your answer..."
          className="bg-muted/30 border-border text-sm h-9"
          onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
        />
        <Button size="sm" variant="outline" className="border-primary text-primary h-9" onClick={handleCustom}>
          <Check className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Extraction Summary Card ─────────────────────────────────────────
function ExtractionSummary({
  extraction,
  editedFields,
  onEdit,
  onConfirm,
  onReset,
}: {
  extraction: Extraction;
  editedFields: Record<string, string>;
  onEdit: (key: string, value: string) => void;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [recentlyEdited, setRecentlyEdited] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (key: string, currentValue: string) => {
    setEditingField(key);
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const saveEdit = (key: string) => {
    onEdit(key, editValue);
    setEditingField(null);
    setRecentlyEdited(key);
    setTimeout(() => setRecentlyEdited(null), 800);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getValue = (key: string): string | null => {
    if (editedFields[key] !== undefined) return editedFields[key];
    return (extraction as any)[key];
  };

  const scaleInfo = getScaleInfo(extraction.scaleScore || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-[10px] border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-body font-semibold text-foreground">What our AI understood</h3>
        <span className="text-xs text-muted-foreground font-body">Review and edit before generating</span>
      </div>

      {/* Fields */}
      <div className="divide-y divide-border">
        {FIELD_CONFIG.map(({ key, label, icon: Icon }, i) => {
          const value = getValue(key);
          const isEditing = editingField === key;
          const wasEdited = editedFields[key] !== undefined;
          const isRecentEdit = recentlyEdited === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3 px-5 py-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground w-28 shrink-0">{label}</span>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-sm bg-muted/30 border-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(key);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={() => saveEdit(key)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-body truncate ${
                        !value ? 'text-amber-400' : isRecentEdit ? 'text-primary' : 'text-foreground'
                      } transition-colors duration-500`}
                    >
                      {value || 'Not specified'}
                    </span>
                    {wasEdited && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                        Edited
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => startEdit(key, value || '')}
                  className="p-1 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          );
        })}

        {/* Scale Score row */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 + FIELD_CONFIG.length * 0.05 }}
          className="flex items-center gap-3 px-5 py-3"
        >
          <BarChart2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground w-28 shrink-0">Scale Score</span>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-mono font-bold text-foreground">{extraction.scaleScore || 0}/100</span>
            <Badge variant="outline" className={`text-[10px] font-bold ${scaleInfo.color}`}>
              {scaleInfo.label}
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border">
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          Looks wrong? Start over
        </button>
        <Button onClick={onConfirm} className="btn-primary-gradient text-primary-foreground font-bold text-sm h-9 px-5">
          <Sparkles className="mr-2 h-3.5 w-3.5" /> Confirm & Generate
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export function AiEventSuggester() {
  const { addEvent } = useStore();
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<FlowStep>('input');
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  const mapCategoryToResource = (cat: string): ResourceCategory => {
    const map: Record<string, ResourceCategory> = {
      Venue: 'Venue', Food: 'Food', Decor: 'Decor',
      Entertainment: 'Misc', Budget: 'Misc',
    };
    return map[cat] || 'Misc';
  };

  const handleExtract = async () => {
    if (!description.trim()) {
      toast.error('Please describe your event first');
      return;
    }
    setStep('extracting');
    setExtraction(null);
    setEditedFields({});
    setFollowUpAnswer(null);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-event-extract', {
        body: { description: description.trim() },
      });
      if (error) throw error;
      if (data?.extraction) {
        setExtraction(data.extraction);
        setStep('review');
      } else {
        // Fallback: skip extraction, go straight to suggestions
        await generateSuggestionsDirect();
      }
    } catch (e: any) {
      console.error('Extraction failed:', e);
      toast.error('Extraction failed — generating suggestions directly');
      await generateSuggestionsDirect();
    }
  };

  const generateSuggestionsDirect = async () => {
    setStep('generating');
    try {
      const { data, error } = await supabase.functions.invoke('ai-event-suggester', {
        body: { details: description.trim() },
      });
      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setStep('results');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to get suggestions. Please try again.');
      setStep('input');
    }
  };

  const handleConfirmAndGenerate = async () => {
    if (!extraction) return;
    setStep('generating');

    const getVal = (key: string) => editedFields[key] !== undefined ? editedFields[key] : (extraction as any)[key] || 'Not specified';

    const details = [
      `Original description: ${description}`,
      '',
      'Extracted & confirmed details:',
      `- Event Type: ${getVal('eventType')}`,
      `- Guests: ${getVal('guests')}`,
      `- Budget: ${getVal('budget')}`,
      `- Location: ${getVal('location')}`,
      `- Formality: ${getVal('formality')}`,
      `- Venue: ${getVal('venue')}`,
      `- Special Notes: ${getVal('specialNotes')}`,
      followUpAnswer ? `- Follow-up answer: ${followUpAnswer}` : '',
      '',
      'Generate 5 hyper-specific suggestions using ALL of the above confirmed details.',
    ].filter(Boolean).join('\n');

    try {
      const { data, error } = await supabase.functions.invoke('ai-event-suggester', {
        body: { details },
      });
      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setStep('results');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to get suggestions. Please try again.');
      setStep('review');
    }
  };

  const handleReset = () => {
    setStep('input');
    setExtraction(null);
    setEditedFields({});
    setFollowUpAnswer(null);
    setSuggestions([]);
  };

  const handleCreateEvent = () => {
    if (!newEventName.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    const budgetStr = editedFields.budget || extraction?.budget || '0';
    const totalBudget = Number(budgetStr.replace(/[^\d]/g, '')) || 0;

    const categoryCount: Record<string, number> = {};
    suggestions.forEach(s => {
      const cat = s.category || 'Budget';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const totalWeight = Object.keys(categoryCount).reduce(
      (sum, cat) => sum + (CATEGORY_WEIGHTS[cat] || 8), 0
    );

    const resources = suggestions.map((s) => {
      const cat = s.category || 'Budget';
      const catWeight = CATEGORY_WEIGHTS[cat] || 8;
      const catShare = Math.floor((catWeight / totalWeight) * totalBudget);
      const perItem = Math.floor(catShare / categoryCount[cat]);
      return {
        id: generateId(),
        name: s.title,
        category: mapCategoryToResource(cat),
        estimatedCost: perItem,
        actualCost: 0,
      };
    });

    const allocated = resources.reduce((s, r) => s + r.estimatedCost, 0);
    if (resources.length > 0) resources[0].estimatedCost += totalBudget - allocated;

    const event = {
      id: generateId(),
      name: newEventName.trim(),
      type: extraction?.eventType || 'Event',
      date: new Date().toISOString().split('T')[0],
      budget: totalBudget,
      resources,
    };
    addEvent(event);
    toast.success(`Event "${newEventName}" created with ${resources.length} resources`);
    setCreateDialogOpen(false);
    setNewEventName('');
  };

  const showFollowUp = extraction && step === 'review' &&
    extraction.followUpQuestion &&
    (extraction.confidenceScore < 70 || extraction.followUpQuestion) &&
    !followUpAnswer;

  return (
    <GlassCard delay={0.1} className="border-primary/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Wand2 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">AI Event Suggester</h2>
        <Badge variant="outline" className="text-[9px] font-bold border-primary/30 text-primary ml-1">AI</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-5 font-body">
        Describe your event in natural language — our AI extracts details and generates tailored suggestions
      </p>

      {/* Step 1: Description Input */}
      {(step === 'input' || step === 'extracting') && (
        <div className="space-y-4">
          <div>
            <Label className="label-caps text-muted-foreground">Describe Your Event</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I'm planning my sister's wedding reception in Mumbai for about 200 guests. Budget is around ₹5 lakhs. We want a formal black-tie evening at a hotel banquet hall..."
              className="bg-muted/30 border-border mt-1 rounded-md min-h-[100px] text-sm font-body"
              disabled={step === 'extracting'}
            />
          </div>
          <Button
            onClick={handleExtract}
            disabled={step === 'extracting' || !description.trim()}
            className="w-full btn-primary-gradient text-primary-foreground font-bold h-11"
          >
            {step === 'extracting' ? 'Analyzing...' : 'Generate Suggestions'}
          </Button>
        </div>
      )}

      {/* Extracting: Confidence loading */}
      {step === 'extracting' && (
        <div className="mt-5 space-y-3">
          <ConfidenceIndicator score={0} loading={true} />
          <div className="flex items-center gap-2 px-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground font-body">Reading your description...</span>
          </div>
        </div>
      )}

      {/* Review step */}
      {step === 'review' && extraction && (
        <div className="mt-5 space-y-4">
          <ConfidenceIndicator score={extraction.confidenceScore} loading={false} />

          {/* Follow-up question */}
          <AnimatePresence>
            {showFollowUp && (
              <FollowUpCard
                question={extraction.followUpQuestion!}
                options={extraction.followUpOptions}
                onAnswer={(a) => setFollowUpAnswer(a)}
              />
            )}
          </AnimatePresence>

          {/* Low confidence message */}
          {extraction.confidenceScore <= 20 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[10px] border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <p className="text-sm text-amber-400 font-body">
                Could you tell us a bit more? The more detail you give, the better your suggestions will be!
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => { setStep('input'); }}
              >
                Add more details
              </Button>
            </motion.div>
          )}

          <ExtractionSummary
            extraction={extraction}
            editedFields={editedFields}
            onEdit={(key, value) => setEditedFields(prev => ({ ...prev, [key]: value }))}
            onConfirm={handleConfirmAndGenerate}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Generating suggestions */}
      {step === 'generating' && (
        <div className="mt-5 space-y-3">
          {extraction && (
            <div className="rounded-[10px] border border-border bg-card p-4 opacity-60">
              <p className="text-xs text-muted-foreground font-body mb-2">AI understood your event — now generating suggestions...</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground font-body">Crafting your personalized suggestions...</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg bg-muted/20 p-4 space-y-2 animate-pulse border border-border">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {step === 'results' && suggestions.length > 0 && (
        <div className="mt-5 space-y-3">
          {suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="rounded-lg bg-muted/20 border border-border p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-[10px] font-bold ${CATEGORY_COLORS[s.category] || 'bg-muted/30 text-muted-foreground border-border'}`}>
                  {s.category}
                </Badge>
                <span className="font-display font-bold text-sm text-foreground">{s.title}</span>
                {s.saving && (
                  <span className="ml-auto text-[10px] font-mono text-success">{s.saving}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-body">{s.detail || s.advice}</p>
              {s.tip && <p className="text-xs text-primary mt-1.5 font-body">{s.tip}</p>}
            </motion.div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button onClick={handleReset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-body">
              <RefreshCw className="h-3 w-3" /> Start Over
            </button>
          </div>

          <Button
            onClick={() => { setNewEventName(extraction?.eventType || 'My Event'); setCreateDialogOpen(true); }}
            className="w-full btn-primary-gradient text-primary-foreground font-bold h-11 mt-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Event from Suggestions
          </Button>
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Name Your Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="label-caps text-muted-foreground">Event Name</Label>
              <Input
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="e.g. Priya's Wedding Reception"
                className="bg-muted/30 border-border mt-1 rounded-md"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground font-body">
              This will create an event with {suggestions.length} resources based on the AI suggestions.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleCreateEvent} className="btn-primary-gradient text-primary-foreground font-bold">Create Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
