import { useState } from 'react';
import { useMarketplaceStore, type ServiceListing, type ServiceCategory } from '@/store/marketplaceStore';
import { generateId } from '@/store/useStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, Eye, MessageSquare, Package, Star, Check, ArrowRight, ArrowLeft, X,
  Camera, Utensils, Palette, Music, Building, Flower2, Briefcase, BarChart2, FileText, Mic, Video, Tent,
  CalendarCheck, RefreshCw, BoxSelect, MapPin, Globe, Navigation, Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { ServiceCard } from './ServiceCard';

const CATEGORIES: { label: string; icon: any; value: ServiceCategory }[] = [
  { label: 'Photography', icon: Camera, value: 'Photography' },
  { label: 'Catering', icon: Utensils, value: 'Catering' },
  { label: 'Decoration', icon: Palette, value: 'Decoration' },
  { label: 'DJ & Music', icon: Music, value: 'DJ & Music' },
  { label: 'Venue', icon: Building, value: 'Venue' },
  { label: 'Flowers', icon: Flower2, value: 'Flowers' },
  { label: 'Financial Advisor', icon: Briefcase, value: 'Financial Advisor' },
  { label: 'Budget Planner', icon: BarChart2, value: 'Budget Planner' },
  { label: 'Tax Consultant', icon: FileText, value: 'Tax Consultant' },
  { label: 'Anchor/Emcee', icon: Mic, value: 'Anchor/Emcee' },
  { label: 'Videography', icon: Video, value: 'Videography' },
  { label: 'Entertainment', icon: Tent, value: 'Entertainment' },
];

const PRICE_TYPES = ['Per Event', 'Per Hour', 'Per Person', 'Fixed Package', 'Per Session'];
const SERVICE_TYPES = [
  { label: 'One-time Event', icon: CalendarCheck },
  { label: 'Ongoing', icon: RefreshCw },
  { label: 'Package Deal', icon: BoxSelect },
];

export function SellerView() {
  const { listings, addListing, updateListing, deleteListing } = useMarketplaceStore();
  const userListings = listings.filter((l) => l.isUserListing);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [serviceType, setServiceType] = useState('One-time Event');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [price, setPrice] = useState(0);
  const [priceType, setPriceType] = useState('Per Event');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [radius, setRadius] = useState('Pan City');
  const [gst, setGst] = useState(false);
  const [included, setIncluded] = useState<string[]>([]);
  const [includeInput, setIncludeInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [turnaround, setTurnaround] = useState('');
  const [experience, setExperience] = useState(0);

  const resetForm = () => {
    setStep(1); setTitle(''); setCategory(''); setServiceType('One-time Event');
    setShortDesc(''); setFullDesc(''); setPrice(0); setPriceType('Per Event');
    setCities([]); setCityInput(''); setRadius('Pan City'); setGst(false);
    setIncluded([]); setIncludeInput(''); setTags([]); setTagInput('');
    setTurnaround(''); setExperience(0);
  };

  const handlePublish = () => {
    if (!title || !category) { toast.error('Please fill required fields'); return; }
    addListing({
      id: generateId(), name: title, category: category as ServiceCategory,
      price, priceType, rating: 0, reviews: 0, cities, tags, included,
      description: fullDesc || shortDesc, turnaround, verified: false,
      enquiries: 0, views: 0, serviceType, gstRegistered: gst,
      experience, isUserListing: true, active: true, memberSince: 'April 2025',
    });
    toast.success('Your service is now live!');
    resetForm();
    setShowForm(false);
  };

  const totalEnquiries = userListings.reduce((s, l) => s + l.enquiries, 0);
  const totalViews = userListings.reduce((s, l) => s + l.views, 0);

  const radiusOptions = [
    { label: 'Local Only', icon: MapPin },
    { label: 'Pan City', icon: Navigation },
    { label: 'Pan India', icon: Globe },
  ];

  return (
    <div className="space-y-8">
      {/* Seller Hero */}
      <div className="rounded-lg p-8 text-coral-foreground" style={{ background: 'linear-gradient(135deg, hsl(0 100% 71%), hsl(20 100% 64%))' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>Turn Your Skills Into Income</h2>
            <p className="mt-2 opacity-90">List your services and connect with thousands of event planners across India</p>
            <div className="flex gap-6 mt-4 text-sm">
              <span>Avg annual earnings: 2.4L</span>
              <span>Free to list</span>
              <span>Get paid securely</span>
            </div>
          </div>
          <Button className="bg-background text-foreground font-bold hover:bg-background/90" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> List New Service
          </Button>
        </div>
      </div>

      {/* Stats */}
      {userListings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Listings', value: userListings.length, icon: Package },
            { label: 'Total Enquiries', value: totalEnquiries, icon: MessageSquare },
            { label: 'Profile Views', value: totalViews, icon: Eye },
          ].map((s) => (
            <GlassCard key={s.label} className="text-center">
              <s.icon className="h-5 w-5 text-coral mx-auto mb-2" />
              <p className="font-mono text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Listings */}
      {userListings.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-foreground mb-2">You haven't listed any services yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Start earning by listing your first service</p>
          <Button className="bg-coral text-coral-foreground font-bold" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> List Your First Service
          </Button>
        </GlassCard>
      ) : (
        <div>
          <h3 className="font-display text-xl font-bold text-foreground mb-4">My Listings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userListings.map((l, i) => (
              <div key={l.id} className="relative">
                <ServiceCard listing={l} index={i} onClick={() => {}} />
                <div className="absolute top-[188px] right-3 flex items-center gap-2 z-10">
                  <Switch checked={l.active !== false} onCheckedChange={(v) => updateListing(l.id, { active: v })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(l.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {l.enquiries > 0 && (
                  <Badge className="absolute top-48 left-3 bg-electric text-electric-foreground text-[10px]">{l.enquiries} Enquiries</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List Service Multi-Step Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            {['Basic Info', 'Pricing', 'Details', 'Preview'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-emerald text-emerald-foreground' : step === i + 1 ? 'bg-coral text-coral-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${step === i + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
                {i < 3 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-emerald' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="label-caps text-muted-foreground">Service Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} className="bg-muted/30 border-border mt-1 rounded-md" />
                <span className="text-[10px] text-muted-foreground">{title.length}/80</span>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Category</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {CATEGORIES.map((c) => {
                    const CIcon = c.icon;
                    return (
                      <button key={c.value} onClick={() => setCategory(c.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${category === c.value ? 'border-coral bg-coral/10' : 'border-border hover:border-muted-foreground'}`}>
                        <CIcon className="h-6 w-6 mx-auto text-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1 block">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Service Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {SERVICE_TYPES.map((t) => {
                    const TIcon = t.icon;
                    return (
                      <button key={t.label} onClick={() => setServiceType(t.label)}
                        className={`p-3 rounded-lg border text-center transition-all ${serviceType === t.label ? 'border-coral bg-coral/10' : 'border-border hover:border-muted-foreground'}`}>
                        <TIcon className="h-5 w-5 mx-auto text-foreground" />
                        <span className="text-xs text-muted-foreground">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Short Description</Label>
                <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value.slice(0, 150))} rows={2} className="bg-muted/30 border-border mt-1 rounded-md" />
                <span className="text-[10px] text-muted-foreground">{shortDesc.length}/150</span>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Full Description</Label>
                <Textarea value={fullDesc} onChange={(e) => setFullDesc(e.target.value.slice(0, 500))} rows={4} className="bg-muted/30 border-border mt-1 rounded-md" />
                <span className="text-[10px] text-muted-foreground">{fullDesc.length}/500</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="label-caps text-muted-foreground">Starting Price (INR)</Label>
                <Input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} className="bg-muted/30 border-border mt-1 font-mono rounded-md" />
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Price Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {PRICE_TYPES.map((pt) => (
                    <button key={pt} onClick={() => setPriceType(pt)}
                      className={`p-2 rounded-lg border text-xs text-center transition-all ${priceType === pt ? 'border-coral bg-coral/10 text-foreground' : 'border-border text-muted-foreground'}`}>
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Cities Served</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Type city name" className="bg-muted/30 border-border rounded-md"
                    onKeyDown={(e) => { if (e.key === 'Enter' && cityInput.trim()) { e.preventDefault(); setCities([...cities, cityInput.trim()]); setCityInput(''); } }} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {cities.map((c) => (
                    <span key={c} className="text-xs px-2 py-1 rounded-md bg-coral/10 text-coral flex items-center gap-1">
                      {c} <X className="h-3 w-3 cursor-pointer" onClick={() => setCities(cities.filter((ci) => ci !== c))} />
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Service Radius</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {radiusOptions.map((r) => {
                    const RIcon = r.icon;
                    return (
                      <button key={r.label} onClick={() => setRadius(r.label)}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs text-center transition-all ${radius === r.label ? 'border-coral bg-coral/10' : 'border-border text-muted-foreground'}`}>
                        <RIcon className="h-3.5 w-3.5" /> {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="label-caps text-muted-foreground">GST Registered</Label>
                <Switch checked={gst} onCheckedChange={setGst} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="label-caps text-muted-foreground">What's Included</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={includeInput} onChange={(e) => setIncludeInput(e.target.value)} placeholder="e.g. Full event coverage" className="bg-muted/30 border-border rounded-md"
                    onKeyDown={(e) => { if (e.key === 'Enter' && includeInput.trim()) { e.preventDefault(); setIncluded([...included, includeInput.trim()]); setIncludeInput(''); } }} />
                  <Button variant="outline" size="sm" className="border-coral text-coral shrink-0" onClick={() => { if (includeInput.trim()) { setIncluded([...included, includeInput.trim()]); setIncludeInput(''); } }}>Add</Button>
                </div>
                <ul className="space-y-1 mt-2">
                  {included.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3 w-3 text-emerald" /> {item}
                      <X className="h-3 w-3 text-muted-foreground cursor-pointer ml-auto" onClick={() => setIncluded(included.filter((_, j) => j !== i))} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Tags (max 5)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. Same Day" className="bg-muted/30 border-border rounded-md"
                    onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim() && tags.length < 5) { e.preventDefault(); setTags([...tags, tagInput.trim()]); setTagInput(''); } }} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-md bg-coral/10 text-coral flex items-center gap-1">
                      {t} <X className="h-3 w-3 cursor-pointer" onClick={() => setTags(tags.filter((tg) => tg !== t))} />
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Turnaround / Booking Lead Time</Label>
                <Input value={turnaround} onChange={(e) => setTurnaround(e.target.value)} placeholder="e.g. Book 2 weeks in advance" className="bg-muted/30 border-border mt-1 rounded-md" />
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Years of Experience</Label>
                <Input type="number" value={experience || ''} onChange={(e) => setExperience(Number(e.target.value))} className="bg-muted/30 border-border mt-1 rounded-md" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-foreground">This is how your listing will appear</h3>
              <div className="max-w-sm mx-auto">
                <ServiceCard
                  listing={{
                    id: 'preview', name: title || 'Your Service', category: (category || 'Photography') as ServiceCategory,
                    price, priceType, rating: 0, reviews: 0, cities, tags, included,
                    description: fullDesc || shortDesc, turnaround, verified: false,
                    enquiries: 0, views: 0, active: true,
                  }}
                  index={0} onClick={() => {}}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald" /><span className="text-foreground">Basic info complete</span></div>
                <div className="flex items-center gap-2 text-sm"><Check className={`h-4 w-4 ${price > 0 ? 'text-emerald' : 'text-muted-foreground'}`} /><span className={price > 0 ? 'text-foreground' : 'text-muted-foreground'}>Pricing set</span></div>
                <div className="flex items-center gap-2 text-sm"><Check className={`h-4 w-4 ${cities.length > 0 ? 'text-emerald' : 'text-muted-foreground'}`} /><span className={cities.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>Location added</span></div>
                <div className="flex items-center gap-2 text-sm"><Check className={`h-4 w-4 ${included.length > 0 ? 'text-emerald' : 'text-muted-foreground'}`} /><span className={included.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>{included.length} inclusions added</span></div>
                <div className="flex items-center gap-2 text-sm"><Check className={`h-4 w-4 ${tags.length > 0 ? 'text-emerald' : 'text-muted-foreground'}`} /><span className={tags.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>{tags.length} tags added</span></div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            ) : <div />}
            {step < 4 ? (
              <Button className="bg-coral text-coral-foreground font-bold" onClick={() => setStep(step + 1)}>Next<ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button className="bg-coral text-coral-foreground font-bold" onClick={handlePublish}>Publish Listing</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { deleteListing(deleteTarget); toast.success('Listing deleted'); setDeleteTarget(null); } }} title="Delete Listing?" description="This will permanently remove your service listing." />
    </div>
  );
}
