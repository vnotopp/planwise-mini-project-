import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const defaultAssets: Asset[] = [
  { id: '1', name: 'Home — Andheri Mumbai', category: 'Real Estate', currentValue: 8000000, purchaseValue: 5000000, purchaseDate: '2018-06-01', notes: '2BHK apartment' },
  { id: '2', name: 'Nifty 50 Index SIP', category: 'Investment', currentValue: 500000, purchaseValue: 420000, annualReturn: 12.4, notes: 'Monthly SIP ₹5,000' },
  { id: '3', name: 'SBI Savings Account', category: 'Bank & Deposits', currentValue: 250000, notes: 'Emergency fund' },
  { id: '4', name: 'HDFC Fixed Deposit', category: 'Bank & Deposits', currentValue: 100000, notes: 'Matures Dec 2025, 7.5% interest' },
  { id: '5', name: 'Physical Gold 50gm', category: 'Precious Metals', currentValue: 300000, notes: 'Stored in bank locker' },
  { id: '6', name: 'LIC Endowment Policy', category: 'Insurance', currentValue: 150000, notes: 'Matures 2028, premium ₹12,000/year' },
  { id: '7', name: 'PPF Account', category: 'Investment', currentValue: 200000, annualReturn: 7.1, notes: 'Matures 2027' },
  { id: '8', name: 'Retail Shop — Dadar', category: 'Business', currentValue: 500000, notes: 'Monthly rental income ₹8,000' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      events: [],
      expenses: [],
      debts: [],
      assets: defaultAssets,
      notifications: [],
      monthlyIncome: 0,
      monthlySavings: 0,

      addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
      updateEvent: (id, data) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      deleteEvent: (id) =>
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          expenses: s.expenses.filter((ex) => ex.eventId !== id),
        })),

      addResource: (eventId, resource) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, resources: [...e.resources, resource] } : e
          ),
        })),
      updateResource: (eventId, resourceId, data) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? { ...e, resources: e.resources.map((r) => (r.id === resourceId ? { ...r, ...data } : r)) }
              : e
          ),
        })),
      deleteResource: (eventId, resourceId) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, resources: e.resources.filter((r) => r.id !== resourceId) } : e
          ),
        })),

      addExpense: (expense) => set((s) => ({ expenses: [...s.expenses, expense] })),
      updateExpense: (id, data) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addDebt: (debt) => set((s) => ({ debts: [...s.debts, debt] })),
      updateDebt: (id, data) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

      addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
      updateAsset: (id, data) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
      deleteAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications].slice(0, 50) })),
      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      setMonthlyIncome: (income) => set({ monthlyIncome: income }),
      setMonthlySavings: (savings) => set({ monthlySavings: savings }),
    }),
    { name: 'planwise-storage' }
  )
);

// Helper: format currency in Indian locale
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

// Helper: generate ID
export const generateId = () => uid();
