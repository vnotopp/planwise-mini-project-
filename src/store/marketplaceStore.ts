import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export type ServiceCategory =
  | 'Photography' | 'Catering' | 'Decoration' | 'DJ & Music'
  | 'Venue' | 'Flowers' | 'Financial Advisor' | 'Budget Planner'
  | 'Tax Consultant' | 'Anchor/Emcee' | 'Videography' | 'Entertainment';

export interface ServiceListing {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  priceType: string;
  rating: number;
  reviews: number;
  cities: string[];
  tags: string[];
  included: string[];
  description: string;
  turnaround: string;
  verified: boolean;
  enquiries: number;
  views: number;
  sellerBio?: string;
  memberSince?: string;
  serviceType?: string;
  gstRegistered?: boolean;
  experience?: number;
  isUserListing?: boolean;
  active?: boolean;
  sellerId?: string;
}

export interface Review {
  id: string;
  serviceId: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

interface MarketplaceState {
  listings: ServiceListing[];
  savedServices: string[];
  loaded: boolean;
  currentUserId: string | null;
  loadAll: (userId: string | null) => Promise<void>;
  addListing: (listing: ServiceListing) => Promise<void>;
  updateListing: (id: string, data: Partial<ServiceListing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  toggleSaved: (id: string) => void;
}

const demoListings: ServiceListing[] = [
  { id: 'demo-1', name: 'Rahul Sharma Photography', category: 'Photography',
    price: 8000, priceType: 'Per Event', rating: 4.9, reviews: 87,
    cities: ['Mumbai', 'Pune'], tags: ['Same Day Delivery', 'RAW Files', 'GST Invoice'],
    included: ['200+ edited photos', 'Full event coverage', 'RAW files', 'Online gallery', 'Same day preview (10 photos)', 'GST invoice provided'],
    description: 'Professional event photographer with 8 years of experience capturing weddings, birthdays, and corporate events across Mumbai and Pune.',
    turnaround: 'Book 2 weeks in advance', verified: true, enquiries: 34, views: 1240,
    sellerBio: 'Award-winning photographer featured in WeddingSutra. Specializes in candid and storytelling style photography.',
    memberSince: 'March 2024', serviceType: 'One-time Event', gstRegistered: true, experience: 8, active: true },
  { id: 'demo-2', name: 'Spice Garden Catering', category: 'Catering',
    price: 450, priceType: 'Per Person', rating: 4.7, reviews: 203,
    cities: ['Mumbai', 'Thane', 'Navi Mumbai'], tags: ['Veg & Non-Veg', 'Live Counters', 'Tasting Available'],
    included: ['Full buffet setup', 'Live counters', 'Service staff', 'Crockery & cutlery', 'Dessert station'],
    description: 'Premium catering service specializing in Indian cuisine for events of 50-500 guests. Offering veg and non-veg menus with live counters.',
    turnaround: 'Book 3 weeks in advance', verified: true, enquiries: 67, views: 3420,
    sellerBio: 'Family-run catering business with 15+ years of culinary excellence.',
    memberSince: 'January 2024', serviceType: 'One-time Event', gstRegistered: true, experience: 15, active: true },
  { id: 'demo-3', name: 'Dreamscape Decorators', category: 'Decoration',
    price: 12000, priceType: 'Per Event', rating: 4.8, reviews: 156,
    cities: ['Delhi', 'Gurgaon', 'Noida'], tags: ['Theme Based', 'Floral', 'Balloon Art'],
    included: ['Full venue decoration', 'Theme setup', 'Floral arrangements', 'Lighting', 'Stage design'],
    description: 'Creative decoration studio transforming venues into magical experiences. Specializing in theme-based decorations for all occasions.',
    turnaround: 'Book 3 weeks in advance', verified: true, enquiries: 45, views: 2100,
    sellerBio: 'Design graduates creating Instagram-worthy event spaces since 2019.',
    memberSince: 'February 2024', serviceType: 'One-time Event', gstRegistered: true, experience: 5, active: true },
  { id: 'demo-4', name: 'DJ Arjun Official', category: 'DJ & Music',
    price: 6500, priceType: 'Per Event', rating: 4.6, reviews: 412,
    cities: ['Bangalore', 'Mysore'], tags: ['Bollywood', 'EDM', 'Own Equipment'],
    included: ['4 hour performance', 'Own sound system', 'LED lights', 'MC services'],
    description: 'Top-rated DJ with 6 years experience playing at weddings, birthdays, and corporate parties. Specializes in Bollywood, EDM, and Punjabi hits.',
    turnaround: 'Book 1 week in advance', verified: true, enquiries: 89, views: 5670,
    sellerBio: 'Resident DJ at multiple Bangalore nightclubs, now available for private events.',
    memberSince: 'April 2024', serviceType: 'One-time Event', gstRegistered: false, experience: 6, active: true },
  { id: 'demo-5', name: 'CA Priya Mehta — Financial Advisor', category: 'Financial Advisor',
    price: 2000, priceType: 'Per Session', rating: 5.0, reviews: 34,
    cities: ['Pan India'], tags: ['Tax Planning', 'Investment', 'Debt Advice'],
    included: ['60 min consultation', 'Written action plan', 'Follow-up email', 'Resource links'],
    description: 'Chartered Accountant with 10 years experience helping individuals and families with tax planning, investments, and debt management.',
    turnaround: 'Available within 2 days', verified: true, enquiries: 23, views: 890,
    sellerBio: 'CA & CFP certified advisor passionate about making financial literacy accessible.',
    memberSince: 'May 2024', serviceType: 'Ongoing', gstRegistered: true, experience: 10, active: true },
  { id: 'demo-6', name: 'EventPro Budget Planners', category: 'Budget Planner',
    price: 1500, priceType: 'Per Event', rating: 4.5, reviews: 67,
    cities: ['Mumbai', 'Pan India'], tags: ['Event Costing', 'Spreadsheet', 'Consultation'],
    included: ['Budget spreadsheet', '2 consultation calls', 'Vendor recommendations', 'Cost tracking'],
    description: 'Professional event budget planners helping you maximize your event without overspending. We create detailed budgets and negotiate with vendors.',
    turnaround: 'Start within 3 days', verified: false, enquiries: 18, views: 654,
    sellerBio: 'Former corporate event managers now helping individuals plan smarter events.',
    memberSince: 'June 2024', serviceType: 'One-time Event', gstRegistered: false, experience: 7, active: true },
  { id: 'demo-7', name: 'Blossom Floral Studio', category: 'Flowers',
    price: 5000, priceType: 'Per Event', rating: 4.9, reviews: 91,
    cities: ['Chennai', 'Coimbatore'], tags: ['Fresh Flowers', 'Same Day', 'Custom Arrangements'],
    included: ['Custom floral design', 'Setup & breakdown', 'Vase hire', 'Free consultation'],
    description: 'Boutique floral studio creating stunning arrangements for weddings, birthdays, and corporate events using only fresh seasonal flowers.',
    turnaround: 'Book 10 days in advance', verified: true, enquiries: 41, views: 1890,
    sellerBio: 'Award-winning florist duo specializing in South Indian wedding aesthetics.',
    memberSince: 'March 2024', serviceType: 'One-time Event', gstRegistered: true, experience: 8, active: true },
  { id: 'demo-8', name: 'VoiceFirst Anchoring', category: 'Anchor/Emcee',
    price: 3500, priceType: 'Per Event', rating: 4.7, reviews: 58,
    cities: ['Hyderabad', 'Bangalore', 'Chennai'], tags: ['Bilingual', 'Corporate', 'Weddings'],
    included: ['Full event hosting', 'Script preparation', 'Rehearsal call', 'Bilingual (Hindi/English)'],
    description: 'Professional anchor and emcee with 5 years experience hosting weddings, corporate events, and college fests. Fluent in Hindi and English.',
    turnaround: 'Book 1 week in advance', verified: true, enquiries: 29, views: 1340,
    sellerBio: 'Radio jockey turned event host, bringing energy and professionalism to every stage.',
    memberSince: 'April 2024', serviceType: 'One-time Event', gstRegistered: false, experience: 5, active: true },
];

const demoReviews: Review[] = [
  { id: 'r1', serviceId: 'demo-1', name: 'Priya M.', rating: 5, date: '2 weeks ago', comment: 'Absolutely amazing work! Rahul captured every moment perfectly. Highly recommended!' },
  { id: 'r2', serviceId: 'demo-1', name: 'Arjun K.', rating: 5, date: '1 month ago', comment: 'The photos were stunning. Delivered on time with beautiful editing.' },
  { id: 'r3', serviceId: 'demo-1', name: 'Sneha R.', rating: 4, date: '2 months ago', comment: 'Great photographer, very professional. Slightly delayed delivery but quality was top-notch.' },
  { id: 'r4', serviceId: 'demo-2', name: 'Vikram S.', rating: 5, date: '1 week ago', comment: 'The live counters were a hit at our wedding! Amazing food and great service.' },
  { id: 'r5', serviceId: 'demo-2', name: 'Neha P.', rating: 4, date: '3 weeks ago', comment: 'Very good taste and variety. Staff was professional and courteous.' },
  { id: 'r6', serviceId: 'demo-3', name: 'Rahul T.', rating: 5, date: '1 week ago', comment: 'Turned our venue into a fairytale! The floral arrangements were breathtaking.' },
  { id: 'r7', serviceId: 'demo-4', name: 'Ananya D.', rating: 5, date: '3 days ago', comment: 'DJ Arjun had everyone dancing all night! Perfect mix of songs.' },
  { id: 'r8', serviceId: 'demo-5', name: 'Sanjay M.', rating: 5, date: '2 weeks ago', comment: 'Priya gave us a clear roadmap for our financial goals. Very knowledgeable.' },
];

export const getReviewsForService = (serviceId: string) =>
  demoReviews.filter((r) => r.serviceId === serviceId);

const dbToListing = (l: any, currentUserId: string | null): ServiceListing => ({
  id: l.id,
  name: l.name,
  category: l.category as ServiceCategory,
  price: Number(l.price) || 0,
  priceType: l.price_type ?? 'Per Event',
  rating: Number(l.rating) || 0,
  reviews: l.review_count ?? 0,
  cities: l.cities ?? [],
  tags: l.tags ?? [],
  included: l.included ?? [],
  description: l.description ?? '',
  turnaround: '',
  verified: !!l.verified,
  enquiries: 0,
  views: 0,
  active: l.is_active !== false,
  sellerId: l.seller_id,
  isUserListing: !!currentUserId && l.seller_id === currentUserId,
});

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      listings: demoListings,
      savedServices: [],
      loaded: false,
      currentUserId: null,

      loadAll: async (userId) => {
        set({ currentUserId: userId });
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Load listings failed', error);
          set({ loaded: true });
          return;
        }
        const dbListings = (data || []).map((l) => dbToListing(l, userId));
        set({ listings: [...dbListings, ...demoListings], loaded: true });
      },

      addListing: async (listing) => {
        const userId = get().currentUserId;
        if (!userId) return;
        const { data, error } = await supabase.from('marketplace_listings').insert({
          seller_id: userId, name: listing.name, category: listing.category,
          description: listing.description, price: listing.price, price_type: listing.priceType,
          cities: listing.cities, tags: listing.tags, included: listing.included,
          is_active: listing.active !== false,
        }).select().single();
        if (error || !data) { console.error(error); return; }
        const newListing = dbToListing(data, userId);
        set((s) => ({ listings: [newListing, ...s.listings] }));
      },

      updateListing: async (id, data) => {
        set((s) => ({ listings: s.listings.map((l) => (l.id === id ? { ...l, ...data } : l)) }));
        if (id.startsWith('demo-')) return;
        const upd: any = {};
        if (data.name !== undefined) upd.name = data.name;
        if (data.price !== undefined) upd.price = data.price;
        if (data.priceType !== undefined) upd.price_type = data.priceType;
        if (data.description !== undefined) upd.description = data.description;
        if (data.cities !== undefined) upd.cities = data.cities;
        if (data.tags !== undefined) upd.tags = data.tags;
        if (data.included !== undefined) upd.included = data.included;
        if (data.active !== undefined) upd.is_active = data.active;
        if (Object.keys(upd).length) {
          const { error } = await supabase.from('marketplace_listings').update(upd).eq('id', id);
          if (error) console.error(error);
        }
      },

      deleteListing: async (id) => {
        set((s) => ({ listings: s.listings.filter((l) => l.id !== id) }));
        if (id.startsWith('demo-')) return;
        const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
        if (error) console.error(error);
      },

      toggleSaved: (id) =>
        set((s) => ({
          savedServices: s.savedServices.includes(id)
            ? s.savedServices.filter((sid) => sid !== id)
            : [...s.savedServices, id],
        })),
    }),
    { name: 'planwise-marketplace', partialize: (s) => ({ savedServices: s.savedServices }) }
  )
);
