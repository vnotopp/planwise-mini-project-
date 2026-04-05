import { useState, useMemo, useRef } from 'react';
import { useMarketplaceStore, type ServiceCategory } from '@/store/marketplaceStore';
import { ServiceCard } from '@/components/marketplace/ServiceCard';
import { ServiceDetailModal } from '@/components/marketplace/ServiceDetailModal';
import { SellerView } from '@/components/marketplace/SellerView';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Search, SlidersHorizontal, LayoutGrid, List, ChevronLeft, ChevronRight, X,
  Camera, Utensils, Palette, Music, Building, Flower2, Briefcase, BarChart2,
  FileText, Mic, Video, Tent, ShoppingBag, Store, Users, Star,
} from 'lucide-react';
import { formatCurrency } from '@/store/useStore';

const categoryIcons: Record<string, any> = {
  'Photography': Camera, 'Catering': Utensils, 'Decoration': Palette,
  'DJ & Music': Music, 'Venue': Building, 'Flowers': Flower2,
  'Financial Advisor': Briefcase, 'Budget Planner': BarChart2,
  'Tax Consultant': FileText, 'Anchor/Emcee': Mic,
  'Videography': Video, 'Entertainment': Tent,
};

const CATEGORIES: { label: string; value: ServiceCategory | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Photography', value: 'Photography' },
  { label: 'Catering', value: 'Catering' },
  { label: 'Decoration', value: 'Decoration' },
  { label: 'DJ & Music', value: 'DJ & Music' },
  { label: 'Venue', value: 'Venue' },
  { label: 'Flowers', value: 'Flowers' },
  { label: 'Financial Advisor', value: 'Financial Advisor' },
  { label: 'Budget Planner', value: 'Budget Planner' },
  { label: 'Tax Consultant', value: 'Tax Consultant' },
  { label: 'Anchor/Emcee', value: 'Anchor/Emcee' },
  { label: 'Videography', value: 'Videography' },
  { label: 'Entertainment', value: 'Entertainment' },
];

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Pan India'];

export default function Marketplace() {
  const { listings } = useMarketplaceStore();
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [budgetRange, setBudgetRange] = useState([500, 100000]);
  const [city, setCity] = useState('');
  const [ratingFilter, setRatingFilter] = useState('Any');
  const [sortBy, setSortBy] = useState('Relevance');
  const [gridView, setGridView] = useState(true);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let results = listings.filter((l) => l.active !== false);
    if (search) results = results.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()) || l.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    if (activeCategory !== 'All') results = results.filter((l) => l.category === activeCategory);
    results = results.filter((l) => l.price >= budgetRange[0] && l.price <= budgetRange[1]);
    if (city) results = results.filter((l) => l.cities.some((c) => c.toLowerCase().includes(city.toLowerCase())));
    if (ratingFilter === '3+') results = results.filter((l) => l.rating >= 3);
    if (ratingFilter === '4+') results = results.filter((l) => l.rating >= 4);
    if (ratingFilter === '4.5+') results = results.filter((l) => l.rating >= 4.5);
    if (sortBy === 'Price: Low to High') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'Price: High to Low') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'Top Rated') results.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'Most Reviewed') results.sort((a, b) => b.reviews - a.reviews);
    return results;
  }, [listings, search, activeCategory, budgetRange, city, ratingFilter, sortBy]);

  const clearFilters = () => {
    setSearch(''); setActiveCategory('All'); setBudgetRange([500, 100000]);
    setCity(''); setRatingFilter('Any'); setSortBy('Relevance');
  };

  const scrollChips = (dir: 'left' | 'right') => {
    chipScrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const selectedService = selectedListing ? listings.find((l) => l.id === selectedListing) || null : null;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative rounded-lg p-8 md:p-12 overflow-hidden" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(var(--primary) / 0.03) 20px, hsl(var(--primary) / 0.03) 40px)' }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl md:text-5xl font-extrabold leading-tight" style={{ letterSpacing: '-0.03em' }}>
              Find the Perfect{' '}
              <span className="text-coral">Service Provider</span>{' '}
              for Your Event.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground">
              Connect with verified photographers, caterers, decorators, DJs, financial advisors and more — all in one place
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-6 pt-2">
              {[
                { label: 'Service Providers', value: 500, icon: Users },
                { label: 'Categories', value: 12, icon: LayoutGrid },
                { label: 'Events Served', value: 10000, icon: ShoppingBag },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <div>
                    <AnimatedCounter value={s.value} className="font-mono text-lg font-bold text-primary" isCurrency={false} />
                    <span className="text-[11px] text-muted-foreground block">{s.label}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <div>
                  <span className="font-mono text-lg font-bold text-primary">4.8</span>
                  <span className="text-[11px] text-muted-foreground block">Avg Rating</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mode Switcher */}
          <div className="bg-muted/50 rounded-lg p-1 flex shrink-0">
            <button onClick={() => setMode('buy')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${mode === 'buy' ? 'bg-electric text-electric-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <ShoppingBag className="h-4 w-4" /> Buy Services
            </button>
            <button onClick={() => setMode('sell')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${mode === 'sell' ? 'bg-coral text-coral-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Store className="h-4 w-4" /> Sell Services
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'sell' ? (
          <motion.div key="sell" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SellerView />
          </motion.div>
        ) : (
          <motion.div key="buy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {/* Search Bar */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 -mx-2 px-2 space-y-4">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search photographers, caterers, DJs, financial advisors..."
                    className="h-14 pl-12 pr-4 text-base bg-card border-border rounded-md focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                  />
                </div>
                <Button className="h-14 px-6 bg-coral text-coral-foreground font-bold rounded-md hover:bg-coral/90">Search</Button>
              </div>

              {/* Category Chips */}
              <div className="relative flex items-center gap-1">
                <button onClick={() => scrollChips('left')} className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-border hover:bg-muted">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div ref={chipScrollRef} className="flex gap-2 overflow-x-auto scrollbar-none flex-1 py-1">
                  {CATEGORIES.map((c) => {
                    const Icon = c.value !== 'All' ? categoryIcons[c.value] : null;
                    return (
                      <button key={c.value} onClick={() => setActiveCategory(c.value)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeCategory === c.value ? 'bg-coral text-coral-foreground' : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}>
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => scrollChips('right')} className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-border hover:bg-muted">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Filter toggle */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowFilters(!showFilters)}>
                  <SlidersHorizontal className="h-4 w-4 mr-2" />{showFilters ? 'Hide Filters' : 'Advanced Filters'}
                </Button>
                {(search || activeCategory !== 'All' || city || ratingFilter !== 'Any') && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" />Clear Filters
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-card">
                      <div>
                        <Label className="label-caps text-muted-foreground mb-2 block">Budget Range</Label>
                        <Slider value={budgetRange} onValueChange={setBudgetRange} min={500} max={100000} step={500} className="mt-3" />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                          <span>{formatCurrency(budgetRange[0])}</span>
                          <span>{formatCurrency(budgetRange[1])}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="label-caps text-muted-foreground mb-2 block">City</Label>
                        <Select value={city} onValueChange={setCity}>
                          <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Any city" /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="any">Any city</SelectItem>
                            {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="label-caps text-muted-foreground mb-2 block">Rating</Label>
                        <div className="flex gap-1.5">
                          {['Any', '3+', '4+', '4.5+'].map((r) => (
                            <button key={r} onClick={() => setRatingFilter(r)}
                              className={`px-2.5 py-1 rounded-md text-xs transition-all ${ratingFilter === r ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="label-caps text-muted-foreground mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="bg-muted/30 border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {['Relevance', 'Price: Low to High', 'Price: High to Low', 'Top Rated', 'Most Reviewed'].map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Showing <span className="font-bold text-foreground">{filtered.length}</span> services</span>
              <div className="flex gap-1">
                <button onClick={() => setGridView(true)} className={`p-2 rounded-md ${gridView ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button onClick={() => setGridView(false)} className={`p-2 rounded-md ${!gridView ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-foreground mb-2">No services found</h3>
                <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or search terms</p>
                <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
              </div>
            ) : (
              <div className={gridView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
                {filtered.map((listing, i) => (
                  <ServiceCard key={listing.id} listing={listing} index={i} onClick={() => setSelectedListing(listing.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ServiceDetailModal listing={selectedService} open={!!selectedListing} onClose={() => setSelectedListing(null)} />
    </div>
  );
}
