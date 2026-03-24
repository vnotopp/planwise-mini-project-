import { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Wand2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/store/useStore';

const EVENT_TYPES = [
  'Birthday Party', 'Wedding', 'Corporate Event', 'Anniversary',
  'Festival Celebration', 'Farewell Party', 'Baby Shower', 'Other',
];

const FORMALITY_LEVELS = [
  { value: 'casual', label: '👕 Casual — Relaxed, no dress code' },
  { value: 'semi-formal', label: '👔 Semi-Formal — Smart casual' },
  { value: 'formal', label: '🤵 Formal — Elegant, dress code expected' },
  { value: 'black-tie', label: '👑 Black Tie — Ultra premium luxury' },
];

const VENUE_TYPES = [
  { value: 'home', label: '🏠 Home / Personal Space' },
  { value: 'banquet', label: '🏛️ Rented Banquet Hall' },
  { value: 'hotel', label: '🏨 Hotel Venue' },
  { value: 'resort', label: '🌿 Resort / Farmhouse' },
  { value: 'outdoor', label: '🌳 Outdoor / Garden' },
  { value: 'undecided', label: '❓ Not Decided Yet' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Venue: 'bg-accent/20 text-accent border-accent/30',
  Food: 'bg-success/20 text-success border-success/30',
  Decor: 'bg-primary/20 text-primary border-primary/30',
  Entertainment: 'bg-[hsl(270_60%_60%)]/20 text-[hsl(270_60%_70%)] border-[hsl(270_60%_60%)]/30',
  Budget: 'bg-warning/20 text-warning border-warning/30',
};

interface Suggestion {
  category: string;
  title: string;
  advice: string;
}

export function AiEventSuggester() {
  const [eventType, setEventType] = useState('');
  const [guests, setGuests] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    if (!eventType || !guests || !budget) {
      toast.error('Please fill in event type, guests, and budget');
      return;
    }
    setLoading(true);
    setSuggestions([]);

    const details = [
      `Event Type: ${eventType}`,
      `Number of Guests: ${guests}`,
      `Budget: ${formatCurrency(Number(budget))}`,
      location ? `Location: ${location}` : '',
      eventDate ? `Event Date: ${eventDate}` : '',
    ].filter(Boolean).join('\n');

    try {
      const { data, error } = await supabase.functions.invoke('ai-event-suggester', {
        body: { details },
      });
      if (error) throw error;
      if (data?.suggestions) setSuggestions(data.suggestions);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to get suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard delay={0.1} className="border-primary/20">
      <div className="flex items-center gap-2 mb-1">
        <Wand2 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold tracking-tight">AI Event Suggester</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Get expert suggestions tailored to your event</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <Label className="label-caps text-muted-foreground">Event Type</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="bg-muted/30 border-border mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="label-caps text-muted-foreground">Number of Guests</Label>
          <Input type="number" value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="e.g. 150" className="bg-muted/30 border-border mt-1" />
        </div>
        <div>
          <Label className="label-caps text-muted-foreground">Budget (₹)</Label>
          <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 500000" className="bg-muted/30 border-border mt-1" />
        </div>
        <div>
          <Label className="label-caps text-muted-foreground">Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai" className="bg-muted/30 border-border mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label className="label-caps text-muted-foreground">Event Date</Label>
          <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="bg-muted/30 border-border mt-1" />
        </div>
      </div>

      <Button onClick={getSuggestions} disabled={loading} className="w-full btn-primary-gradient text-primary-foreground font-bold h-11">
        {loading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
      </Button>

      {loading && (
        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg bg-muted/30 p-4 space-y-2 animate-pulse">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="mt-5 space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-lg bg-muted/20 border border-border p-4 noise-overlay">
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <Badge variant="outline" className={`text-[10px] font-bold ${CATEGORY_COLORS[s.category] || 'bg-muted/30 text-muted-foreground border-border'}`}>
                  {s.category}
                </Badge>
                <span className="font-display font-bold text-sm text-foreground">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">{s.advice}</p>
            </div>
          ))}
          <button onClick={getSuggestions} className="flex items-center gap-1 text-xs text-primary hover:text-secondary transition-colors">
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
        </div>
      )}
    </GlassCard>
  );
}
