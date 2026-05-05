import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export type ResourceCategory = 'Food' | 'Venue' | 'Decor' | 'Transport' | 'Misc';
export type AssetCategory = 'Investment' | 'Real Estate' | 'Bank & Deposits' | 'Precious Metals' | 'Insurance' | 'Business';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  estimatedCost: number;
  actualCost: number;
}

export interface PlanEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  budget: number;
  resources: Resource[];
}

export interface Expense {
  id: string;
  eventId: string;
  resourceId: string;
  amount: number;
  date: string;
  note: string;
}

export interface Debt {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  minimumPayment: number;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currentValue: number;
  purchaseValue?: number;
  purchaseDate?: string;
  annualReturn?: number;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'milestone' | 'tip';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface AppState {
  events: PlanEvent[];
  expenses: Expense[];
  debts: Debt[];
  assets: Asset[];
  notifications: Notification[];
  monthlyIncome: number;
  monthlySavings: number;
  loaded: boolean;
  currentUserId: string | null;

  loadAll: (userId: string) => Promise<void>;
  resetState: () => void;

  addEvent: (event: PlanEvent) => void;
  updateEvent: (id: string, event: Partial<PlanEvent>) => void;
  deleteEvent: (id: string) => void;
  addResource: (eventId: string, resource: Resource) => void;
  updateResource: (eventId: string, resourceId: string, resource: Partial<Resource>) => void;
  deleteResource: (eventId: string, resourceId: string) => void;

  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addDebt: (debt: Debt) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  setMonthlyIncome: (income: number) => void;
  setMonthlySavings: (savings: number) => void;
}

const uid = () => crypto.randomUUID();

const empty = {
  events: [] as PlanEvent[],
  expenses: [] as Expense[],
  debts: [] as Debt[],
  assets: [] as Asset[],
  notifications: [] as Notification[],
  monthlyIncome: 0,
  monthlySavings: 0,
};

// Debounced settings save
let settingsTimer: ReturnType<typeof setTimeout> | null = null;
const saveSettings = (userId: string, monthlyIncome: number, monthlySavings: number) => {
  if (settingsTimer) clearTimeout(settingsTimer);
  settingsTimer = setTimeout(() => {
    supabase.from('user_financial_settings').upsert(
      { user_id: userId, monthly_income: monthlyIncome, monthly_savings: monthlySavings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).then(({ error }) => { if (error) console.error('Settings save failed', error); });
  }, 600);
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...empty,
      loaded: false,
      currentUserId: null,

      resetState: () => set({ ...empty, loaded: false, currentUserId: null }),

      loadAll: async (userId) => {
        if (get().currentUserId === userId && get().loaded) return;
        set({ currentUserId: userId, loaded: false });

        const [evRes, resRes, debtRes, assetRes, settingsRes] = await Promise.all([
          supabase.from('events').select('*').eq('user_id', userId),
          supabase.from('resources').select('*').eq('user_id', userId),
          supabase.from('debts').select('*').eq('user_id', userId),
          supabase.from('assets').select('*').eq('user_id', userId),
          supabase.from('user_financial_settings').select('*').eq('user_id', userId).maybeSingle(),
        ]);

        const resources = (resRes.data || []) as any[];
        const events: PlanEvent[] = (evRes.data || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          type: e.type ?? '',
          date: e.date ?? '',
          budget: Number(e.budget) || 0,
          resources: resources
            .filter((r) => r.event_id === e.id)
            .map((r) => ({
              id: r.id,
              name: r.name,
              category: (r.category as ResourceCategory) || 'Misc',
              estimatedCost: Number(r.estimated_cost) || 0,
              actualCost: Number(r.actual_cost) || 0,
            })),
        }));

        const debts: Debt[] = (debtRes.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          principal: Number(d.principal) || 0,
          interestRate: Number(d.interest_rate) || 0,
          minimumPayment: Number(d.minimum_payment) || 0,
        }));

        const assets: Asset[] = (assetRes.data || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          category: (a.category as AssetCategory) || 'Investment',
          currentValue: Number(a.current_value) || 0,
          purchaseValue: a.purchase_value !== null ? Number(a.purchase_value) : undefined,
          purchaseDate: a.purchase_date ?? undefined,
          annualReturn: a.annual_return !== null ? Number(a.annual_return) : undefined,
          notes: a.notes ?? undefined,
        }));

        set({
          events,
          debts,
          assets,
          monthlyIncome: settingsRes.data ? Number(settingsRes.data.monthly_income) || 0 : 0,
          monthlySavings: settingsRes.data ? Number(settingsRes.data.monthly_savings) || 0 : 0,
          loaded: true,
        });
      },

      addEvent: (event) => {
        const userId = get().currentUserId;
        set((s) => ({ events: [...s.events, event] }));
        if (!userId) return;
        supabase.from('events').insert({
          id: event.id, user_id: userId, name: event.name, type: event.type, date: event.date, budget: event.budget,
        }).then(({ error }) => { if (error) console.error(error); });
      },
      updateEvent: (id, data) => {
        const userId = get().currentUserId;
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...data } : e)) }));
        if (!userId) return;
        const upd: any = {};
        if (data.name !== undefined) upd.name = data.name;
        if (data.type !== undefined) upd.type = data.type;
        if (data.date !== undefined) upd.date = data.date;
        if (data.budget !== undefined) upd.budget = data.budget;
        if (Object.keys(upd).length) supabase.from('events').update(upd).eq('id', id).then(({ error }) => { if (error) console.error(error); });
      },
      deleteEvent: (id) => {
        const userId = get().currentUserId;
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          expenses: s.expenses.filter((ex) => ex.eventId !== id),
        }));
        if (!userId) return;
        supabase.from('resources').delete().eq('event_id', id).then(() => {
          supabase.from('events').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
        });
      },

      addResource: (eventId, resource) => {
        const userId = get().currentUserId;
        set((s) => ({
          events: s.events.map((e) => e.id === eventId ? { ...e, resources: [...e.resources, resource] } : e),
        }));
        if (!userId) return;
        supabase.from('resources').insert({
          id: resource.id, user_id: userId, event_id: eventId, name: resource.name,
          category: resource.category, estimated_cost: resource.estimatedCost, actual_cost: resource.actualCost,
        }).then(({ error }) => { if (error) console.error(error); });
      },
      updateResource: (eventId, resourceId, data) => {
        const userId = get().currentUserId;
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, resources: e.resources.map((r) => (r.id === resourceId ? { ...r, ...data } : r)) } : e
          ),
        }));
        if (!userId) return;
        const upd: any = {};
        if (data.name !== undefined) upd.name = data.name;
        if (data.category !== undefined) upd.category = data.category;
        if (data.estimatedCost !== undefined) upd.estimated_cost = data.estimatedCost;
        if (data.actualCost !== undefined) upd.actual_cost = data.actualCost;
        if (Object.keys(upd).length) supabase.from('resources').update(upd).eq('id', resourceId).then(({ error }) => { if (error) console.error(error); });
      },
      deleteResource: (eventId, resourceId) => {
        const userId = get().currentUserId;
        set((s) => ({
          events: s.events.map((e) => e.id === eventId ? { ...e, resources: e.resources.filter((r) => r.id !== resourceId) } : e),
        }));
        if (!userId) return;
        supabase.from('resources').delete().eq('id', resourceId).then(({ error }) => { if (error) console.error(error); });
      },

      addExpense: (expense) => set((s) => ({ expenses: [...s.expenses, expense] })),
      updateExpense: (id, data) => set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addDebt: (debt) => {
        const userId = get().currentUserId;
        set((s) => ({ debts: [...s.debts, debt] }));
        if (!userId) return;
        supabase.from('debts').insert({
          id: debt.id, user_id: userId, name: debt.name, principal: debt.principal,
          interest_rate: debt.interestRate, minimum_payment: debt.minimumPayment,
        }).then(({ error }) => { if (error) console.error(error); });
      },
      updateDebt: (id, data) => {
        const userId = get().currentUserId;
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)) }));
        if (!userId) return;
        const upd: any = {};
        if (data.name !== undefined) upd.name = data.name;
        if (data.principal !== undefined) upd.principal = data.principal;
        if (data.interestRate !== undefined) upd.interest_rate = data.interestRate;
        if (data.minimumPayment !== undefined) upd.minimum_payment = data.minimumPayment;
        if (Object.keys(upd).length) supabase.from('debts').update(upd).eq('id', id).then(({ error }) => { if (error) console.error(error); });
      },
      deleteDebt: (id) => {
        const userId = get().currentUserId;
        set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));
        if (!userId) return;
        supabase.from('debts').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
      },

      addAsset: (asset) => {
        const userId = get().currentUserId;
        set((s) => ({ assets: [...s.assets, asset] }));
        if (!userId) return;
        supabase.from('assets').insert({
          id: asset.id, user_id: userId, name: asset.name, category: asset.category,
          current_value: asset.currentValue, purchase_value: asset.purchaseValue ?? null,
          purchase_date: asset.purchaseDate ?? null, annual_return: asset.annualReturn ?? null,
          notes: asset.notes ?? null,
        }).then(({ error }) => { if (error) console.error(error); });
      },
      updateAsset: (id, data) => {
        const userId = get().currentUserId;
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
        if (!userId) return;
        const upd: any = {};
        if (data.name !== undefined) upd.name = data.name;
        if (data.category !== undefined) upd.category = data.category;
        if (data.currentValue !== undefined) upd.current_value = data.currentValue;
        if (data.purchaseValue !== undefined) upd.purchase_value = data.purchaseValue;
        if (data.purchaseDate !== undefined) upd.purchase_date = data.purchaseDate;
        if (data.annualReturn !== undefined) upd.annual_return = data.annualReturn;
        if (data.notes !== undefined) upd.notes = data.notes;
        if (Object.keys(upd).length) supabase.from('assets').update(upd).eq('id', id).then(({ error }) => { if (error) console.error(error); });
      },
      deleteAsset: (id) => {
        const userId = get().currentUserId;
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
        if (!userId) return;
        supabase.from('assets').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
      },

      addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications].slice(0, 50) })),
      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      setMonthlyIncome: (income) => {
        set({ monthlyIncome: income });
        const userId = get().currentUserId;
        if (userId) saveSettings(userId, income, get().monthlySavings);
      },
      setMonthlySavings: (savings) => {
        set({ monthlySavings: savings });
        const userId = get().currentUserId;
        if (userId) saveSettings(userId, get().monthlyIncome, savings);
      },
    }),
    {
      name: 'planwise-storage',
      // Only persist client-side ephemeral data (expenses, notifications). Server-backed data reloads on auth.
      partialize: (s) => ({ expenses: s.expenses, notifications: s.notifications }),
    }
  )
);

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export const generateId = () => uid();
