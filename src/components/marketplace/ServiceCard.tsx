import { Heart, MapPin, Clock, Star, CheckCircle2, Camera, Utensils, Palette, Music, Building, Flower2, Briefcase, BarChart2, FileText, Mic, Video, Tent } from 'lucide-react';
import { type ServiceListing, useMarketplaceStore } from '@/store/marketplaceStore';
import { formatCurrency } from '@/store/useStore';
import { motion } from 'framer-motion';

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

interface Props {
  listing: ServiceListing;
  index: number;
  onClick: () => void;
}

export function ServiceCard({ listing, index, onClick }: Props) {
  const { savedServices, toggleSaved } = useMarketplaceStore();
  const isSaved = savedServices.includes(listing.id);
  const Icon = categoryIcons[listing.category] || Camera;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-l-[3px] hover:border-l-coral"
    >
      {/* Banner */}
      <div
        className="relative h-[180px] flex items-center justify-center"
        style={{ background: categoryGradients[listing.category] || categoryGradients['Photography'] }}
      >
        <Icon className="h-12 w-12 text-white/80 drop-shadow-lg" />
        <span className="absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-background/80 text-foreground px-2 py-1 rounded-md">
          {listing.category}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleSaved(listing.id); }}
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-md bg-background/60 hover:bg-background/90 transition-colors"
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-coral text-coral' : 'text-foreground'}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Seller row */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
            {listing.name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-foreground truncate">{listing.name.split(' ')[0]} {listing.name.split(' ')[1]?.[0]}.</span>
          {listing.verified && (
            <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(listing.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
          ))}
          <span className="font-mono text-xs font-bold text-foreground ml-1">{listing.rating}</span>
          <span className="text-xs text-muted-foreground">({listing.reviews} reviews)</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold text-foreground leading-tight line-clamp-2">{listing.name}</h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {listing.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 bg-coral/10 text-coral font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-coral inline-block" />
              {tag}
            </span>
          ))}
        </div>

        {/* Location + turnaround */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.cities[0]}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{listing.turnaround}</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-2 border-t border-border">
          <div>
            <span className="text-[11px] text-muted-foreground block">Starting at</span>
            <span className="font-mono text-xl font-bold text-primary">{formatCurrency(listing.price)}</span>
            {listing.priceType !== 'Per Event' && <span className="text-xs text-muted-foreground ml-1">/{listing.priceType.replace('Per ', '')}</span>}
          </div>
          <button className="px-4 py-2 bg-coral text-coral-foreground text-sm font-bold rounded-md hover:bg-coral/90 transition-colors">
            Hire Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
