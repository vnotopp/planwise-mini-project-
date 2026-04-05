import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarDays, Wallet, BarChart2, Target, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'planwise-user-setup';

const roles = [
  { id: 'event-planner', icon: CalendarDays, label: 'Event Planner' },
  { id: 'budget-manager', icon: Wallet, label: 'Budget Manager' },
  { id: 'financial-analyst', icon: BarChart2, label: 'Financial Analyst' },
  { id: 'all', icon: Target, label: 'All of the above' },
];

export interface UserSetup {
  name: string;
  role: string;
}

export function getUserSetup(): UserSetup | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSetup;
  } catch {
    return null;
  }
}

export function saveUserSetup(data: UserSetup) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface Props {
  open: boolean;
  onComplete: () => void;
  initialValues?: UserSetup | null;
}

export function OnboardingModal({ open, onComplete, initialValues }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [role, setRole] = useState(initialValues?.role ?? '');

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name);
      setRole(initialValues.role);
    }
  }, [initialValues]);

  const isValid = name.trim().length > 0 && role.length > 0;
  const isEditing = !!initialValues;

  const handleSubmit = () => {
    if (!isValid) return;
    const data: UserSetup = { name: name.trim(), role };
    saveUserSetup(data);
    onComplete();
    toast.success(`Welcome to PlanWise, ${data.name}!`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-2">
              {isEditing && <Pencil className="h-5 w-5 text-primary" />}
              <h2 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
                {isEditing ? 'Edit Your Profile' : 'Welcome to PlanWise'}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing ? 'Update your details below' : "Let's personalize your experience"}
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="label-caps text-muted-foreground mb-1.5 block">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vedant Sawant"
                  className="bg-muted/30 border-border"
                />
              </div>

              <div>
                <label className="label-caps text-muted-foreground mb-2 block">
                  Your Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const selected = role === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 text-foreground font-medium'
                            : 'border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground/40'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="mt-6 w-full btn-primary-gradient font-bold"
            >
              {isEditing ? 'Save Changes' : 'Get Started'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
