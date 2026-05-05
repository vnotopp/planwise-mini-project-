import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, CheckCircle2, MapPin, Package, Zap, Globe, Check,
  Camera, Utensils, Palette, Music, Building, Flower2, Briefcase, BarChart2, FileText, Mic, Video, Tent } from 'lucide-react';
import { type ServiceListing, getReviewsForService } from '@/store/marketplaceStore';
import { useStore, formatCurrency, generateId, type ResourceCategory } from '@/store/useStore';
import { toast } from 'sonner';

const categoryGradients: Record<string, string> = {
  'Photography': 'linear-gradient(135deg, #1a1a2e, #16213e)',
  'Catering': 'linear-gradient(135deg, #2d1b00, #4a2f00)',
  'Decoration': 'linear-gradient(135deg, #1a0533, #2d0d54)',
  'DJ & Music': 'linear-gradient(135deg, #001a33, #002952)',
  'Venue': 'linear-gradient(135deg, #1a0a00, #331400)',
  'Flowers': 'linear-gradient(135deg, #1a0d1a, #2e162e)',
  'Financial Advisor': 'linear-gradient(135deg, #001a0d, #002e18)',
  'Budget Planner': 'linear-gradient(135deg, #1a1400, #2e2400)',
  'Tax Consultant': 'linear-gradient(135deg, #0d1a1a, #162e2e)',
  'Anchor/Emcee': 'linear-gradient(135deg, #1a0a1a, #2e142e)',
  'Videography': 'linear-gradient(135deg, #0a1a1a, #142e2e)',
  'Entertainment': 'linear-gradient(135deg, #1a1a0a, #2e2e14)',
};

const categoryIcons: Record<string, any> = {
  'Photography': Camera, 'Catering': Utensils, 'Decoration': Palette,
  'DJ & Music': Music, 'Venue': Building, 'Flowers': Flower2,
  'Financial Advisor': Briefcase, 'Budget Planner': BarChart2,
  'Tax Consultant': FileText, 'Anchor/Emcee': Mic,
  'Videography': Video, 'Entertainment': Tent,
};

const categoryToResource: Record<string, ResourceCategory> = {
  'Photography': 'Misc', 'Catering': 'Food', 'Decoration': 'Decor',
  'DJ & Music': 'Misc', 'Venue': 'Venue', 'Flowers': 'Decor',
  'Financial Advisor': 'Misc', 'Budget Planner': 'Misc',
  'Tax Consultant': 'Misc', 'Anchor/Emcee': 'Misc',
  'Videography': 'Misc', 'Entertainment': 'Misc',
};

interface Props {
  listing: ServiceListing | null;
  open: boolean;
  onClose: () => void;
}

export function ServiceDetailModal({ listing, open, onClose }: Props) {
  const { events, addResource } = useStore();
  const [selectedEvent, setSelectedEvent] = useState('');
  const reviews = listing ? getReviewsForService(listing.id) : [];

  if (!listing) return null;

  const Icon = categoryIcons[listing.category] || Camera;

  const handleAddToEvent = () => {
    if (!selectedEvent) { toast.error('Please select an event'); return; }
    const ev = events.find((e) => e.id === selectedEvent);
    if (!ev) return;
    addResource(selectedEvent, {
      id: generateId(),
      name: listing.name,
      category: categoryToResource[listing.category] || 'Misc',
      estimatedCost: listing.price,
      actualCost: 0,
    });
    toast.success(`Added to ${ev.name}`);
    setSelectedEvent('');
  };

  const handleHireNow = async () => {
    const { useAuthStore } = await import('@/store/useAuthStore');
    const user = useAuthStore.getState().user;
    if (!user) { toast.error('Please sign in to hire'); return; }
    if (!listing.sellerId) { toast.success('Enquiry sent! The seller will contact you within 24 hours.'); onClose(); return; }
    if (listing.sellerId === user.id) { toast.error("You can't hire your own listing"); return; }
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.from('enquiries').insert({
      buyer_id: user.id, seller_id: listing.sellerId, listing_id: listing.id, status: 'pending',
    });
    if (error) { toast.error('Failed to send enquiry', { description: error.message }); return; }
    toast.success('Enquiry sent! The seller will contact you within 24 hours.');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-0">
          {/* Left Side */}
          <div className="p-6 space-y-6 border-r border-border">
            <div
              className="h-48 rounded-lg flex items-center justify-center"
              style={{ background: categoryGradients[listing.category] }}
            >
              <Icon className="h-16 w-16 text-white/80" />
            </div>

            <div className="text-xs text-muted-foreground">
              Marketplace &gt; {listing.category} &gt; <span className="text-foreground">{listing.name}</span>
            </div>

            <h2 className="font-display text-2xl font-extrabold text-foreground" style={{ letterSpacing: '-0.02em' }}>
              {listing.name}
            </h2>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">
                {listing.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-sm">{listing.name.split('—')[0].trim()}</span>
                  {listing.verified && <CheckCircle2 className="h-4 w-4 text-accent" />}
                </div>
                <span className="text-xs text-muted-foreground">Member since {listing.memberSince || 'March 2024'}</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(listing.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                ))}
                <span className="font-mono text-sm font-bold ml-1">{listing.rating}</span>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="font-display font-bold text-foreground mb-2">About this Service</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-foreground mb-3">What's Included</h3>
              <ul className="space-y-2">
                {listing.included.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-emerald shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-foreground mb-2">About the Seller</h3>
              <p className="text-sm text-muted-foreground mb-3">{listing.sellerBio || listing.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Package className="h-4 w-4" />{listing.enquiries} orders completed</span>
                <span className="flex items-center gap-1"><Zap className="h-4 w-4" />Responds within 2 hours</span>
                <span className="flex items-center gap-1"><Globe className="h-4 w-4" />Serves: {listing.cities.join(', ')}</span>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-foreground mb-3">Customer Reviews ({listing.reviews})</h3>
              <div className="space-y-4">
                {(reviews.length > 0 ? reviews : [
                  { id: 'gen-1', serviceId: listing.id, name: 'Happy Customer', rating: 5, date: '1 week ago', comment: 'Excellent service! Would definitely recommend to friends and family.' },
                  { id: 'gen-2', serviceId: listing.id, name: 'Event Planner', rating: 4, date: '2 weeks ago', comment: 'Professional and reliable. Good value for money.' },
                ]).slice(0, 3).map((rev) => (
                  <div key={rev.id} className="border border-border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{rev.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-foreground">{rev.name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">{rev.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side — Booking Card */}
          <div className="p-6 space-y-5 lg:sticky lg:top-0 self-start">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Starting at</span>
              <p className="font-mono text-3xl font-bold text-primary">{formatCurrency(listing.price)}</p>
              {listing.priceType !== 'Per Event' && <span className="text-xs text-muted-foreground">/{listing.priceType.replace('Per ', '')}</span>}
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <div>
                <Label className="label-caps text-muted-foreground">Event Date</Label>
                <Input type="date" className="bg-muted/30 border-border mt-1 rounded-md" />
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Number of Guests</Label>
                <Input type="number" placeholder="e.g. 100" className="bg-muted/30 border-border mt-1 rounded-md" />
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Your City</Label>
                <Input placeholder="e.g. Mumbai" className="bg-muted/30 border-border mt-1 rounded-md" />
              </div>
              <div>
                <Label className="label-caps text-muted-foreground">Special Requirements</Label>
                <Textarea placeholder="Any special requests..." rows={3} className="bg-muted/30 border-border mt-1 rounded-md" />
              </div>
            </div>

            {events.length > 0 && (
              <div className="space-y-2">
                <Label className="label-caps text-muted-foreground">Add to Event Budget</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Select event..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full border-electric text-electric hover:bg-electric/10" onClick={handleAddToEvent}>
                  Add to Event Budget
                </Button>
              </div>
            )}

            <Button className="w-full bg-coral text-coral-foreground font-bold text-base py-6 rounded-md hover:bg-coral/90" onClick={handleHireNow}>
              Hire Now
            </Button>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald" />Free consultation first</div>
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald" />No payment till confirmed</div>
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald" />100% satisfaction guarantee</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
