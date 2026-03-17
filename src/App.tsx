import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import EventPlanner from "./pages/EventPlanner";
import ExpenseTracker from "./pages/ExpenseTracker";
import DebtManager from "./pages/DebtManager";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" toastOptions={{ className: 'glass-card border-border text-foreground' }} />
      <BrowserRouter>
        <AppLayout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<EventPlanner />} />
              <Route path="/expenses" element={<ExpenseTracker />} />
              <Route path="/debts" element={<DebtManager />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
