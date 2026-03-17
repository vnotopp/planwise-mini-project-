import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResourceCategory = 'Food' | 'Venue' | 'Decor' | 'Transport' | 'Misc';

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

interface AppState {
  events: PlanEvent[];
  expenses: Expense[];
  debts: Debt[];
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
  setMonthlyIncome: (income: number) => void;
  setMonthlySavings: (savings: number) => void;
}

const uid = () => crypto.randomUUID();

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      events: [],
      expenses: [],
      debts: [],
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
